<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the response language from `Accept-Language`.
 *
 * The frontend always sends an exact supported tag, but the API is also called
 * by browsers and integrations that send a full negotiation string, so the
 * header is parsed rather than trusted. Anything unrecognised falls back
 * silently — an API must not 400 because a client asked for Danish.
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supported = config('vitaqueen.locales');
        $locale = config('app.fallback_locale');

        foreach ($this->rankedLocales($request->header('Accept-Language')) as $candidate) {
            if (in_array($candidate, $supported, true)) {
                $locale = $candidate;
                break;
            }
        }

        app()->setLocale($locale);

        $response = $next($request);
        $response->headers->set('Content-Language', $locale);
        // Two clients asking for different languages must not share a cache entry.
        $response->headers->set('Vary', 'Accept-Language', false);

        return $response;
    }

    /** @return array<int, string> */
    private function rankedLocales(?string $header): array
    {
        if (blank($header)) {
            return [];
        }

        return collect(explode(',', $header))
            ->map(function (string $part): array {
                [$tag, $params] = array_pad(explode(';', trim($part), 2), 2, null);
                preg_match('/q=([0-9.]+)/', (string) $params, $matches);

                return ['tag' => mb_strtolower(trim($tag)), 'q' => (float) ($matches[1] ?? 1)];
            })
            ->sortByDesc('q')
            ->flatMap(fn (array $entry) => [$entry['tag'], explode('-', $entry['tag'])[0]])
            ->unique()
            ->values()
            ->all();
    }
}
