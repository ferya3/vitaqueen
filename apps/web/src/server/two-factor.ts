import 'server-only';
import { now, run } from './db';
import { encrypt, sha256 } from './secrets';
import { generateRecoveryCodes } from './totp';

/**
 * Stores a fresh set of recovery codes (hashed, then encrypted) and returns the
 * plaintext once, for display.
 *
 * Lives outside the `'use server'` modules on purpose: every export of those
 * is a public endpoint, and this takes a user id.
 */
export function issueRecoveryCodes(userId: number) {
  const codes = generateRecoveryCodes();
  run('UPDATE users SET recovery_codes = ?, updated_at = ? WHERE id = ?', [
    encrypt(JSON.stringify(codes.map(sha256))),
    now(),
    userId,
  ]);
  return codes;
}
