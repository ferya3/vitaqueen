import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Time-based one-time passwords (RFC 6238), on `node:crypto` alone.
 *
 * Compatible with Google Authenticator, Microsoft Authenticator, 1Password,
 * Aegis and the rest: SHA-1, six digits, 30-second steps.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    value = (value << 5) | ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** 160 random bits, the size RFC 4226 recommends for SHA-1. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function codeAt(secret: Buffer, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac('sha1', secret).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

export function currentStep(at = Date.now()) {
  return Math.floor(at / 1000 / STEP_SECONDS);
}

/**
 * Returns the matching step, or `null`.
 *
 * One step either side is accepted for clock drift. `notAfterStep` is the last
 * step already used by this account; anything at or before it is refused, so
 * a code read over someone's shoulder cannot be replayed within its window.
 */
export function verifyTotp(secret: string, code: string, notAfterStep: number | null = null): number | null {
  const digits = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(digits)) return null;

  const key = base32Decode(secret);
  const step = currentStep();
  for (const candidate of [step - 1, step, step + 1]) {
    if (notAfterStep !== null && candidate <= notAfterStep) continue;
    const expected = Buffer.from(codeAt(key, candidate));
    if (timingSafeEqual(expected, Buffer.from(digits))) return candidate;
  }
  return null;
}

export function otpauthUri(secret: string, account: string, issuer = 'VitaQueen') {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Ten single-use codes, `xxxxx-xxxxx`, about 50 bits each. */
export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = base32Encode(randomBytes(7)).toLowerCase().slice(0, 10);
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}
