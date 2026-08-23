<?php

declare(strict_types=1);

namespace App\Models\Concerns;

/**
 * Per-locale content stored as JSON on the row itself.
 *
 * The alternative — a `*_translations` table per model — doubles the query
 * count for every list endpoint and buys flexibility this site does not need:
 * the locale set is fixed at four, and no locale has its own extra fields.
 *
 *     $product->name              // resolved for the current request locale
 *     $product->getTranslation('name', 'ru')
 *     $product->setTranslation('name', 'ru', 'VitaQueen 1 л')
 *
 * Values are stored as `{"fa": "…", "en": "…"}`. A missing locale falls back to
 * the configured fallback, then to the first non-empty value, so a half-
 * translated record renders instead of showing a blank page.
 */
trait HasTranslations
{
    /**
     * @return array<int, string>
     *
     * `property_exists` rather than `$this->translatable ?? []`: Eloquent's
     * `__get` treats an undefined property as a relationship and throws, so a
     * model that uses this trait without declaring the list must not go
     * through the magic accessor.
     */
    public function translatableAttributes(): array
    {
        return property_exists($this, 'translatable') ? $this->translatable : [];
    }

    public function getAttributeValue($key)
    {
        if (! in_array($key, $this->translatableAttributes(), true)) {
            return parent::getAttributeValue($key);
        }

        return $this->getTranslation($key, app()->getLocale());
    }

    public function getTranslation(string $key, ?string $locale = null): ?string
    {
        $locale ??= app()->getLocale();
        $values = $this->translationsFor($key);

        if (filled($values[$locale] ?? null)) {
            return $values[$locale];
        }

        $fallback = config('app.fallback_locale');
        if (filled($values[$fallback] ?? null)) {
            return $values[$fallback];
        }

        foreach ($values as $value) {
            if (filled($value)) {
                return $value;
            }
        }

        return null;
    }

    /** @return array<string, string> */
    public function translationsFor(string $key): array
    {
        $raw = $this->attributes[$key] ?? null;

        if (is_array($raw)) {
            return $raw;
        }

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);

            return is_array($decoded) ? $decoded : [config('app.fallback_locale') => $raw];
        }

        return [];
    }

    public function setTranslation(string $key, string $locale, ?string $value): static
    {
        $values = $this->translationsFor($key);
        $values[$locale] = $value;
        $this->attributes[$key] = json_encode($values, JSON_UNESCAPED_UNICODE);

        return $this;
    }

    /** @param array<string, string|null> $values */
    public function setTranslations(string $key, array $values): static
    {
        $existing = $this->translationsFor($key);
        $this->attributes[$key] = json_encode(
            array_merge($existing, $values),
            JSON_UNESCAPED_UNICODE,
        );

        return $this;
    }

    public function setAttribute($key, $value)
    {
        if (in_array($key, $this->translatableAttributes(), true) && is_array($value)) {
            return $this->setTranslations($key, $value);
        }

        return parent::setAttribute($key, $value);
    }
}
