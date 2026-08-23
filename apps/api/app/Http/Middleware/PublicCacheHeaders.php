<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Makes public reads cacheable at the edge.
 *
 * This is where caching for this API belongs. Cloudflare and the Next.js data
 * cache both honour these headers, they are shared across every process and
 * every deploy, and they expire on a clock rather than on someone remembering
 * to call `Cache::forget()` in the right place.
 *
 * `stale-while-revalidate` matters more than the max-age here: when the CMS is
 * being edited, or the database is briefly slow, visitors keep getting the
 * previous copy instead of a spinner.
 */
class PublicCacheHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // `isMethodCacheable()` covers HEAD as well as GET. `isMethod('GET')`
        // would quietly drop the headers from every HEAD request, which is
        // exactly what a cache uses to revalidate.
        if (! $request->isMethodCacheable() || $response->getStatusCode() !== 200) {
            return $response;
        }

        $response->headers->set(
            'Cache-Control',
            'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        );

        return $response;
    }
}
