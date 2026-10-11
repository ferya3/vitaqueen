import 'server-only';
import { headers } from 'next/headers';

/**
 * Facts about the current request that the security code needs.
 *
 * The client address is taken from `X-Real-IP`, which nginx *sets* (never
 * appends) to the address it saw — behind Cloudflare that is the visitor,
 * because nginx's real_ip module has already resolved CF-Connecting-IP. The
 * other headers are only fallbacks for running without nginx, where port 3000
 * is bound to loopback and nothing outside can reach it to forge them.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-real-ip') ??
    h.get('cf-connecting-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  ).slice(0, 45);
}

export async function userAgent(): Promise<string | null> {
  return (await headers()).get('user-agent')?.slice(0, 255) ?? null;
}

/** Whether the visitor reached us over TLS, directly or through the proxy. */
export async function isSecureRequest(): Promise<boolean> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwarded) return forwarded === 'https';
  return process.env.FORCE_SECURE_COOKIES === 'true';
}
