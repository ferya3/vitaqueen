import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dataDir } from '../../db/core.mjs';

/**
 * Encryption at rest for the few values that must not be readable from a copy
 * of the database alone: TOTP secrets and recovery codes.
 *
 * The key comes from `APP_SECRET` (the installer generates one into
 * `.env.local`). Development falls back to a key file next to the database so
 * `npm run dev` works with no setup; production refuses to start without the
 * variable, because a key that sits beside the data it protects protects
 * nothing.
 */
let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;

  let secret = process.env.APP_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('APP_SECRET is not set. Generate one with: openssl rand -hex 32');
    }
    const file = join(dataDir(), 'dev-app-secret');
    if (!existsSync(file)) writeFileSync(file, randomBytes(32).toString('hex'), { mode: 0o600 });
    secret = readFileSync(file, 'utf8').trim();
  }

  // Hashing normalises any length of secret to a 256-bit key.
  cachedKey = createHash('sha256').update(`vitaqueen:at-rest:${secret}`).digest();
  return cachedKey;
}

/** AES-256-GCM. Output: `v1.<iv>.<tag>.<ciphertext>`, base64url parts. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), body.toString('base64url')].join('.');
}

export function decrypt(payload: string): string {
  const [version, iv, tag, body] = payload.split('.');
  if (version !== 'v1' || !iv || !tag || body === undefined) throw new Error('Unrecognised ciphertext');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8');
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
