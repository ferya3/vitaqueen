import 'server-only';
import { get } from './db';
import { mediaUrl } from './media-url';
import { parseTranslations, type Translations } from './translations';

/** Read helpers shared by the admin pages. */

export function mediaInfo(id: unknown): { url: string; label: string; image: boolean } | null {
  if (id === null || id === undefined) return null;
  const row = get<{ path: string; original_name: string; kind: string }>(
    'SELECT path, original_name, kind FROM media WHERE id = ?',
    [Number(id)],
  );
  return row ? { url: mediaUrl(row.path), label: row.original_name, image: row.kind === 'image' } : null;
}

export function t(raw: unknown): Translations {
  return parseTranslations(raw);
}

/** The Persian value for lists, falling back to whatever exists. */
export function fa(raw: unknown): string {
  const values = parseTranslations(raw);
  return values.fa ?? values.en ?? Object.values(values)[0] ?? '—';
}

export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
