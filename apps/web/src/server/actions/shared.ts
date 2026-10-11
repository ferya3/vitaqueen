import 'server-only';
import type { FormState } from '@/lib/form-state';
import { get } from '@/server/db';
import { UploadError } from '@/server/media';

/**
 * Helpers for the `'use server'` modules. Kept in a plain server-only module:
 * anything exported from a `'use server'` file becomes a callable endpoint.
 */

export const INVALID = 'لطفاً خطاهای فرم را برطرف کنید.';

export function invalid(fieldErrors: Record<string, string>): FormState {
  return { error: INVALID, fieldErrors };
}

export function hasErrors(errors: Record<string, string>) {
  return Object.keys(errors).length > 0;
}

/** Turns an upload failure into a form message; anything else is rethrown. */
export function uploadFailure(error: unknown, field: string): FormState {
  if (error instanceof UploadError) return { error: error.message, fieldErrors: { [field]: error.message } };
  throw error;
}

/** Whether `column = value` is already taken by a row other than `id`. */
export function taken(table: string, column: string, value: string, id: number | null) {
  return !!get(`SELECT 1 FROM ${table} WHERE ${column} = ? AND id IS NOT ? LIMIT 1`, [value, id]);
}

/** Names of the fields that differ, for the audit log. Values are not logged. */
export function changedFields(before: Record<string, unknown> | undefined, after: Record<string, unknown>) {
  if (!before) return Object.keys(after);
  return Object.keys(after).filter((key) => String(before[key] ?? '') !== String(after[key] ?? ''));
}
