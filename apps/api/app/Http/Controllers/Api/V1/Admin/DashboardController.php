<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Certificate;
use App\Models\ContactMessage;
use App\Models\NewsArticle;
use App\Models\Product;
use App\Models\User;
use App\Models\WaterAnalysis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Numbers the person running the factory actually needs on opening the panel:
 * what is unanswered, what is about to expire, and what has been changed.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'counts' => [
                'products' => Product::count(),
                'publishedProducts' => Product::where('is_published', true)->count(),
                'articles' => NewsArticle::count(),
                'certificates' => Certificate::count(),
                'analyses' => WaterAnalysis::count(),
                'unhandledMessages' => $user->can('viewAny', ContactMessage::class)
                    ? ContactMessage::whereNull('handled_at')->count()
                    : null,
            ],
            // The single most useful alert on a site like this: a certificate
            // that is still on the public page but is about to stop being true.
            'expiringCertificates' => Certificate::where('is_published', true)
                ->whereNotNull('valid_until')
                ->whereBetween('valid_until', [today(), today()->addDays(90)])
                ->orderBy('valid_until')
                ->get(['id', 'slug', 'title', 'valid_until']),
            'recentActivity' => $user->can('viewAuditLog', User::class)
                ? AuditLog::with('user:id,name')->latest()->limit(10)->get()
                : [],
        ]);
    }
}
