import { defineRouting } from 'next-intl/routing';

/**
 * Every locale the site has content for. The message catalogues for all four
 * are complete and stay in the repository whether or not they are served.
 */
export const allLocales = ['fa', 'en', 'ar', 'ru'] as const;
export type Locale = (typeof allLocales)[number];

/**
 * The locales actually served right now.
 *
 * Multilingual is switched off until launch: the site runs in Persian only.
 * This array is the entire switch — put the other three back and the routes,
 * the language picker, `hreflang`, the sitemap and the locale negotiation in
 * `proxy.ts` all come back with them. Nothing else is conditional on it.
 */
export const locales: readonly Locale[] = ['fa'];

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
