<?php

declare(strict_types=1);

namespace App\Services;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * Sanitises editor HTML before it is stored.
 *
 * Two decisions worth stating plainly:
 *
 *  1. Sanitising on **write**, not on read. Storing raw editor output and
 *     cleaning it on the way out means every future consumer — a feed, an
 *     export, a mobile app — has to remember to clean it too. One of them will
 *     not.
 *  2. HTMLPurifier rather than a regular expression or `strip_tags`. Every
 *     hand-rolled HTML sanitiser eventually meets an attribute it did not
 *     anticipate; this one has met them already.
 *
 * The allow-list is deliberately narrow: it is what a news post and a privacy
 * policy need, and nothing else. No `<script>`, no `<iframe>`, no inline styles,
 * no `on*` handlers, and no `javascript:` or `data:` URLs.
 */
final class HtmlSanitizer
{
    private HTMLPurifier $purifier;

    public function __construct()
    {
        $config = HTMLPurifier_Config::createDefault();

        $config->set('Cache.SerializerPath', storage_path('app/htmlpurifier'));
        $config->set('HTML.Doctype', 'HTML 4.01 Transitional');
        $config->set(
            'HTML.Allowed',
            'p,br,strong,em,u,s,blockquote,'
            .'h2,h3,h4,'
            .'ul,ol,li,'
            .'a[href|title|rel|target],'
            .'img[src|alt|width|height],'
            .'table,thead,tbody,tr,th[scope],td,'
            // No `figure`/`figcaption`: HTMLPurifier's HTML 4.01 definition
            // does not know the HTML5 elements, and quietly teaching it a
            // custom element definition is more risk than a caption is worth.
            .'hr,sup,sub,code,pre'
        );
        $config->set('HTML.TargetBlank', true);
        $config->set('HTML.Nofollow', true);
        $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true, 'mailto' => true]);
        $config->set('Attr.AllowedFrameTargets', ['_blank']);
        // Editors paste from Word; keep the markup, drop the styling soup.
        $config->set('CSS.AllowedProperties', []);
        $config->set('Core.Encoding', 'UTF-8');
        // Persian and Arabic bodies need `dir` on block elements.
        $config->set('Attr.EnableID', false);

        if (! is_dir(storage_path('app/htmlpurifier'))) {
            mkdir(storage_path('app/htmlpurifier'), 0755, true);
        }

        $this->purifier = new HTMLPurifier($config);
    }

    public function clean(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        return $this->purifier->purify($html);
    }

    /**
     * Cleans every locale in a translatable body field.
     *
     * @param  array<string, string|null>  $translations
     * @return array<string, string|null>
     */
    public function cleanTranslations(array $translations): array
    {
        return array_map(fn (?string $value) => $this->clean($value), $translations);
    }
}
