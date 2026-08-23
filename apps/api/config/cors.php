<?php

declare(strict_types=1);

/**
 * The API is called server-to-server by Next.js, so in production the browser
 * never talks to it directly and no origin needs to be allowed at all.
 *
 * `CORS_ALLOWED_ORIGINS` exists for local development and for the admin panel
 * if it is ever hosted separately. It is an explicit list — never `*`, which
 * with credentials enabled would be an open door.
 */
return [
    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
    )),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Accept-Language', 'X-Requested-With'],

    'exposed_headers' => ['Content-Language'],

    'max_age' => 3600,

    'supports_credentials' => false,
];
