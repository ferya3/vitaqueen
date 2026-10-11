import { locales, type Locale } from '@/i18n/routing';

/** A translatable column as stored: `{"fa": "…", "en": "…"}`. */
export type Translations = Partial<Record<Locale, string>>;

export function parseTranslations(raw: unknown): Translations {
  if (typeof raw !== 'string' || raw === '') return {};
  try {
    const value = JSON.parse(raw) as unknown;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const out: Translations = {};
      for (const locale of locales) {
        const text = (value as Record<string, unknown>)[locale];
        if (typeof text === 'string' && text.trim() !== '') out[locale] = text;
      }
      return out;
    }
  } catch {
    // A plain string written by hand: treat it as the default language.
  }
  return { fa: raw };
}

/**
 * Resolves a translatable value for one locale.
 *
 * Order: the requested locale, then English (the export markets read it), then
 * Persian, then whatever exists. A half-translated record therefore renders
 * in some language instead of as a blank.
 */
export function pick(raw: unknown, locale: Locale): string {
  const values = parseTranslations(raw);
  return values[locale] ?? values.en ?? values.fa ?? Object.values(values)[0] ?? '';
}

export function pickOrNull(raw: unknown, locale: Locale): string | null {
  return pick(raw, locale) || null;
}

/** Serialises for storage; an object with no text at all is stored as NULL. */
export function toStored(values: Translations): string | null {
  const clean: Translations = {};
  for (const locale of locales) {
    const text = values[locale]?.trim();
    if (text) clean[locale] = text;
  }
  return Object.keys(clean).length > 0 ? JSON.stringify(clean) : null;
}
