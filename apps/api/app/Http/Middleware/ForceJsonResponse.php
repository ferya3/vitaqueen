<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The API only speaks JSON.
 *
 * Without this, a request with `Accept: text/html` gets an HTML error page —
 * which on a validation failure means leaking a stack trace to something that
 * was never meant to render HTML in the first place.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
