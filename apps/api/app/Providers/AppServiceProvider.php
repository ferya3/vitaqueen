<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models;
use App\Policies;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use PragmaRX\Google2FA\Google2FA;

class AppServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    private const POLICIES = [
        Models\Product::class => Policies\ProductPolicy::class,
        Models\Certificate::class => Policies\CertificatePolicy::class,
        Models\NewsArticle::class => Policies\NewsArticlePolicy::class,
        Models\Page::class => Policies\PagePolicy::class,
        Models\ProductionStage::class => Policies\ProductionStagePolicy::class,
        Models\Distributor::class => Policies\DistributorPolicy::class,
        Models\WaterAnalysis::class => Policies\WaterAnalysisPolicy::class,
        Models\Media::class => Policies\MediaPolicy::class,
        Models\ContactMessage::class => Policies\ContactMessagePolicy::class,
        Models\User::class => Policies\UserPolicy::class,
    ];

    public function register(): void
    {
        $this->app->singleton(Google2FA::class);
    }

    public function boot(): void
    {
        foreach (self::POLICIES as $model => $policy) {
            Gate::policy($model, $policy);
        }

        $this->configureRateLimiting();

        // Behind a TLS-terminating proxy the app sees plain HTTP and would
        // otherwise generate `http://` links and signed URLs.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }

    /**
     * Rate limits.
     *
     * Three buckets, sized to what each route actually costs:
     *
     *   public-api  generous — these are cached reads behind a CDN
     *   contact     tight    — writes, sends mail, and is the abuse target
     *   login       tightest — the credential-stuffing surface
     *
     * Keyed on the resolved client IP, which is only trustworthy because
     * `trustProxies` is an explicit list (see `bootstrap/app.php`).
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('public-api', function (Request $request) {
            // The Next.js renderer is one machine serving everyone; per-IP
            // limits would throttle the entire site the moment its cache went
            // cold. It identifies itself with a shared secret instead.
            if ($this->isInternalCaller($request)) {
                return Limit::none();
            }

            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('contact', fn (Request $request) => [
            Limit::perMinute(3)->by($request->ip()),
            Limit::perDay(30)->by($request->ip()),
        ]);

        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
            Limit::perMinute(5)->by((string) $request->input('email')),
        ]);

        RateLimiter::for('uploads', fn (Request $request) => Limit::perMinute(20)->by($request->user()?->id ?: $request->ip()));
    }

    private function isInternalCaller(Request $request): bool
    {
        $expected = config('vitaqueen.security.internal_token');

        if (blank($expected)) {
            return false;
        }

        $presented = $request->bearerToken() ?? '';

        // Constant-time: a timing-variable comparison here would leak the
        // token one byte at a time.
        return hash_equals((string) $expected, $presented);
    }
}
