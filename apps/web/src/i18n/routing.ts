import { defineRouting } from 'next-intl/routing';

export const locales = ['fa', 'en', 'ar', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fa';

/** Locales that render right-to-left. Drives `dir`, logical spacing and motion direction. */
export const rtlLocales: readonly Locale[] = ['fa', 'ar'];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

export function getDirection(locale: string): 'rtl' | 'ltr' {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

/** BCP-47 tags used for `hreflang`, `Intl.*` formatting and Open Graph. */
export const localeTags: Record<Locale, string> = {
  fa: 'fa-IR',
  en: 'en-US',
  ar: 'ar',
  ru: 'ru-RU',
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every locale carries its prefix. Export markets get stable, cacheable URLs
  // and `hreflang` stays trivial to generate.
  localePrefix: 'always',
  localeDetection: true,
});
