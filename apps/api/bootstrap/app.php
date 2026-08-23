<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureTwoFactorIsEnabled;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\PublicCacheHeaders;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The API is stateless and speaks JSON only. Every request gets the
        // security headers and a resolved locale; nothing gets a session.
        $middleware->api(prepend: [
            HandleCors::class,
            ForceJsonResponse::class,
            SecurityHeaders::class,
            SetLocale::class,
        ]);

        $middleware->alias([
            'two-factor' => EnsureTwoFactorIsEnabled::class,
            'public-cache' => PublicCacheHeaders::class,
        ]);

        // Cloudflare and nginx sit in front, so the client address arrives in a
        // forwarded header. TRUSTED_PROXIES must name them explicitly — a
        // wildcard here lets anyone who reaches the origin spoof their IP and
        // walk straight through the rate limiter.
        $middleware->trustProxies(
            at: array_values(array_filter(explode(',', (string) env('TRUSTED_PROXIES', '')))),
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // The API answers in JSON even when the client forgot to ask.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // No custom catch-all renderer here, on purpose. Laravel already
        // returns `{"message": "Server Error"}` with no trace whenever
        // APP_DEBUG is false, and an over-eager `render()` callback swallows
        // the exceptions the framework renders properly — validation,
        // authentication, authorisation, throttling — and turns a 422 into a
        // 500. Keeping APP_DEBUG false is the control; see docs/security.md.

    })->create();
