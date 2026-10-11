import { localeTags, type Locale } from '@/i18n/routing';

/** Locale-aware number formatting that keeps lab values readable in every script. */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(localeTags[locale], {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatDate(value: string | Date, locale: Locale) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    // Persian users expect the Solar Hijri calendar; the others get Gregorian.
    calendar: locale === 'fa' ? 'persian' : undefined,
    timeZone: 'Asia/Tehran',
  }).format(date);
}

/**
 * `330` -> `330 ml`, `1500` -> `1.5 L`. Kept in one place so labels agree.
 *
 * Units in the reader's script. A Latin "ml" after Persian or Arabic digits is
 * reordered by the bidi algorithm and reads "ml ۵۰۰" — the unit has to be in
 * the same script as the number for the line to read the right way round.
 */
const VOLUME_UNITS: Record<Locale, { ml: string; l: string }> = {
  fa: { ml: 'میلی‌لیتر', l: 'لیتر' },
  ar: { ml: 'مل', l: 'لتر' },
  ru: { ml: 'мл', l: 'л' },
  en: { ml: 'ml', l: 'L' },
};

export function formatVolume(millilitres: number, locale: Locale) {
  const units = VOLUME_UNITS[locale] ?? VOLUME_UNITS.en;
  if (millilitres >= 1000) {
    return `${formatNumber(millilitres / 1000, locale)} ${units.l}`;
  }
  return `${formatNumber(millilitres, locale)} ${units.ml}`;
}
