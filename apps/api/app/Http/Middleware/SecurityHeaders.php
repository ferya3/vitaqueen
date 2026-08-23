<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Defensive headers for API responses.
 *
 * nginx and Cloudflare set these too. Duplicating them here means a direct hit
 * on the PHP process — from inside the network, or through a misconfigured
 * proxy — is still protected.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');
        $response->headers->set('Permissions-Policy', 'interest-cohort=()');
        // JSON is never a document; refuse to be one.
        $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; sandbox");

        if ($request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=63072000; includeSubDomains; preload',
            );
        }

        return $response;
    }
}
