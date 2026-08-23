<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\CertificateController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\DistributorController;
use App\Http\Controllers\Api\V1\NewsController;
use App\Http\Controllers\Api\V1\PageController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductionStageController;
use App\Http\Controllers\Api\V1\SourceController;
use App\Http\Controllers\Api\V1\WaterAnalysisController;
use Illuminate\Support\Facades\Route;

/*
|---------------------------------------------------------------------------
| API v1
|---------------------------------------------------------------------------
|
| Versioned from the first line. When the frontend needs a breaking change to
| a payload, `v2` is added alongside and `v1` keeps serving whatever is already
| deployed — which matters here because the Next.js app and the API are
| released independently.
|
| Public routes are read-only and cacheable. `POST /contact` is the only public
| write, and it is throttled here as well as at the edge.
|
*/

Route::prefix('v1')->group(function (): void {
    Route::middleware(['throttle:public-api', 'public-cache'])->group(function (): void {
        Route::get('products', [ProductController::class, 'index'])->name('products.index');
        Route::get('products/{slug}', [ProductController::class, 'show'])->name('products.show');

        Route::get('certificates', [CertificateController::class, 'index'])->name('certificates.index');

        Route::get('water-analysis', [WaterAnalysisController::class, 'show'])->name('water-analysis.show');
        Route::get('water-analyses', [WaterAnalysisController::class, 'index'])->name('water-analyses.index');

        Route::get('source', [SourceController::class, 'show'])->name('source.show');
        Route::get('production-stages', [ProductionStageController::class, 'index'])->name('production-stages.index');

        Route::get('news', [NewsController::class, 'index'])->name('news.index');
        Route::get('news/{slug}', [NewsController::class, 'show'])->name('news.show');

        Route::get('pages/{slug}', [PageController::class, 'show'])->name('pages.show');

        Route::get('distributors', [DistributorController::class, 'index'])->name('distributors.index');
    });

    // Tighter bucket: a contact form is the most-abused route on a company site.
    Route::post('contact', [ContactController::class, 'store'])
        ->middleware('throttle:contact')
        ->name('contact.store');

    /*
    |-----------------------------------------------------------------------
    | Admin
    |-----------------------------------------------------------------------
    |
    | Everything below requires a Sanctum token, an active account and — for
    | privileged roles — a confirmed second factor. Authorisation beyond that
    | is per-resource, in the policies.
    |
    */
    Route::prefix('admin')->name('admin.')->group(function (): void {
        Route::post('login', [Admin\AuthController::class, 'login'])
            ->middleware('throttle:login')
            ->name('login');

        Route::middleware(['auth:sanctum', 'two-factor'])->group(function (): void {
            Route::post('logout', [Admin\AuthController::class, 'logout'])->name('logout');
            Route::get('me', [Admin\AuthController::class, 'me'])->name('me');

            Route::prefix('two-factor')->name('two-factor.')->group(function (): void {
                Route::post('/', [Admin\TwoFactorController::class, 'store'])->name('store');
                Route::post('confirm', [Admin\TwoFactorController::class, 'confirm'])->name('confirm');
                Route::delete('/', [Admin\TwoFactorController::class, 'destroy'])->name('destroy');
            });

            Route::get('dashboard', Admin\DashboardController::class)->name('dashboard');

            Route::apiResource('products', Admin\ProductController::class);
            Route::apiResource('certificates', Admin\CertificateController::class);
            Route::apiResource('water-analyses', Admin\WaterAnalysisController::class)
                ->parameters(['water-analyses' => 'water_analysis']);
            Route::apiResource('news', Admin\NewsArticleController::class)
                ->parameters(['news' => 'news_article']);
            Route::apiResource('pages', Admin\PageController::class);
            Route::apiResource('production-stages', Admin\ProductionStageController::class)
                ->parameters(['production-stages' => 'production_stage']);
            Route::apiResource('distributors', Admin\DistributorController::class);
            Route::apiResource('users', Admin\UserController::class);

            Route::get('source', [Admin\SourceProfileController::class, 'show'])->name('source.show');
            Route::put('source', [Admin\SourceProfileController::class, 'update'])->name('source.update');

            Route::get('media', [Admin\MediaController::class, 'index'])->name('media.index');
            Route::post('media', [Admin\MediaController::class, 'store'])
                ->middleware('throttle:uploads')
                ->name('media.store');
            Route::delete('media/{media}', [Admin\MediaController::class, 'destroy'])->name('media.destroy');

            Route::get('contact-messages', [Admin\ContactMessageController::class, 'index'])->name('contact-messages.index');
            Route::get('contact-messages/{contactMessage}', [Admin\ContactMessageController::class, 'show'])->name('contact-messages.show');
            Route::post('contact-messages/{contactMessage}/handled', [Admin\ContactMessageController::class, 'markHandled'])->name('contact-messages.handled');
            Route::delete('contact-messages/{contactMessage}', [Admin\ContactMessageController::class, 'destroy'])->name('contact-messages.destroy');

            Route::get('audit-logs', [Admin\AuditLogController::class, 'index'])->name('audit-logs.index');
        });
    });
});
