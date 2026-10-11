import 'server-only';
import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/routing';
import type { Translations } from './translations';

/** Small, strict readers for `FormData`. Nothing here trusts the browser. */

export function text(data: FormData, name: string, max = 500): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function optionalText(data: FormData, name: string, max = 500): string | null {
  return text(data, name, max) || null;
}

export function bool(data: FormData, name: string): boolean {
  const value = data.get(name);
  return value === 'on' || value === '1' || value === 'true';
}

/** Accepts Persian and Arabic-Indic digits as well as ASCII, since editors type both. */
function asciiDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٫]/g, '.')
    .replace(/[٬,]/g, '');
}

export function number(data: FormData, name: string): number | null {
  const raw = asciiDigits(text(data, name, 40));
  if (raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : NaN;
}

export function integer(data: FormData, name: string): number | null {
  const value = number(data, name);
  return value === null || Number.isNaN(value) ? value : Math.round(value);
}

/** Reads `name.fa`, `name.en`, `name.ar`, `name.ru`. */
export function localized(data: FormData, name: string, max = 20_000): Translations {
  const out: Translations = {};
  for (const locale of locales) {
    const value = text(data, `${name}.${locale}`, max);
    if (value) out[locale] = value;
  }
  return out;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Every public page reads the database per request; this drops any cached render. */
export function refreshSite() {
  revalidatePath('/', 'layout');
}
