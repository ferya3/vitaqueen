/**
 * Text splitting is not script-neutral.
 *
 * Arabic-script languages (Persian and Arabic here) shape their glyphs from
 * context: `آب خالص` is drawn as connected forms, and wrapping each character
 * in its own element breaks the joins so the word renders as loose, wrong
 * letters. Word-level splitting is safe because words are separated by spaces,
 * which never join; line-level splitting is safe for the same reason.
 *
 * So: ask for whatever reads best, and let this downgrade it where the script
 * demands it.
 */
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export type SplitGranularity = 'lines' | 'words' | 'chars';

export function containsArabicScript(text: string) {
  return ARABIC_SCRIPT.test(text);
}

export function resolveSplitType(
  requested: SplitGranularity,
  element: Element | null,
): SplitGranularity {
  if (requested !== 'chars') return requested;
  const text = element?.textContent ?? '';
  return containsArabicScript(text) ? 'words' : 'chars';
}
