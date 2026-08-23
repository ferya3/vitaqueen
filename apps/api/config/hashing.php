<?php

declare(strict_types=1);

/**
 * Argon2id, as the architecture calls for.
 *
 * The parameters below target roughly 100–200 ms per hash on the production
 * box. Measure on the real hardware before changing them: too low and the
 * hashes are cheap to attack, too high and the login endpoint becomes its own
 * denial-of-service surface.
 */
return [
    'driver' => env('HASH_DRIVER', 'argon2id'),

    'bcrypt' => [
        'rounds' => (int) env('BCRYPT_ROUNDS', 12),
        'verify' => true,
    ],

    'argon' => [
        'memory' => (int) env('ARGON_MEMORY', 65536),  // 64 MiB
        'threads' => (int) env('ARGON_THREADS', 2),
        'time' => (int) env('ARGON_TIME', 4),
        'verify' => true,
    ],

    // Re-hash on login when the cost parameters have been raised since.
    'rehash_on_login' => true,
];
