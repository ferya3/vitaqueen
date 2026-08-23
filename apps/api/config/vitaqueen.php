<?php

declare(strict_types=1);

/**
 * Application settings that are specific to this factory rather than to
 * Laravel. Keeping them here — instead of scattered `env()` calls — means the
 * config cache actually works in production, where `env()` returns null.
 */
return [
    /** Locales served by the public site. Order is irrelevant; membership is not. */
    'locales' => ['fa', 'en', 'ar', 'ru'],

    /**
     * Nutrition is identical for every format because it is the same water.
     * Derived in `ProductResource` rather than typed into each product, so five
     * records cannot disagree about how much fat is in water.
     */
    'nutrition_per_100ml' => [
        'energy' => '0 kJ / 0 kcal',
        'fat' => '0 g',
        'carbohydrate' => '0 g',
        'protein' => '0 g',
        'salt' => env('VITAQUEEN_SALT_PER_100ML', '0.02 g'),
    ],

    /** Where each enquiry topic is routed. */
    'mailboxes' => [
        'general' => env('MAIL_TO_GENERAL', 'info@vitaqueen.com'),
        'sales' => env('MAIL_TO_SALES', 'sales@vitaqueen.com'),
        'export' => env('MAIL_TO_EXPORT', 'export@vitaqueen.com'),
        'quality' => env('MAIL_TO_QUALITY', 'quality@vitaqueen.com'),
        'career' => env('MAIL_TO_CAREER', 'hr@vitaqueen.com'),
    ],

    'media' => [
        // SVG is a script-capable format. Off unless someone deliberately
        // accepts that and puts a scrubber in front of it.
        'allow_svg' => (bool) env('VITAQUEEN_ALLOW_SVG', false),
    ],

    'security' => [
        /**
         * Shared secret presented by the Next.js server on its own requests.
         *
         * The frontend is a single machine rendering pages for every visitor,
         * so limiting it per IP would throttle the whole site on one cold
         * cache. Requests that prove they are the frontend skip the public
         * per-IP bucket; everything else stays limited.
         */
        'internal_token' => env('INTERNAL_API_TOKEN'),

        /** Admin tokens are short-lived; the panel refreshes on activity. */
        'token_lifetime_minutes' => (int) env('ADMIN_TOKEN_LIFETIME', 480),

        /** Roles that may not access the admin API without a second factor. */
        'two_factor_required_roles' => ['super_admin', 'admin', 'editor'],

        /** Audit rows older than this are pruned by `vitaqueen:prune`. */
        'audit_retention_days' => (int) env('AUDIT_RETENTION_DAYS', 730),

        /** Enquiries keep IP and user agent for this long, then lose them. */
        'contact_pii_retention_days' => (int) env('CONTACT_PII_RETENTION_DAYS', 90),
    ],
];
