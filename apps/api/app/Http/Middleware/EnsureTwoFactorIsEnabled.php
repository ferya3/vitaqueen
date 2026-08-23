<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks privileged accounts that have not finished enrolling a second factor.
 *
 * Enrolment endpoints are excluded, otherwise the requirement would lock people
 * out of the very screens that let them satisfy it.
 */
class EnsureTwoFactorIsEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $required = collect(config('vitaqueen.security.two_factor_required_roles', []))
            ->map(fn (string $role) => UserRole::from($role));

        if (! $required->contains($user->role)) {
            return $next($request);
        }

        if ($user->hasTwoFactorEnabled() || $request->routeIs('admin.two-factor.*')) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Two-factor authentication must be enabled for this account.',
            'code' => 'two_factor_required',
        ], 403);
    }
}
