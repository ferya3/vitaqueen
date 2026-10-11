'use server';

import { contactSchema } from '@/lib/contact-schema';
import { now, run } from '@/server/db';
import { hit } from '@/server/rate-limit';
import { clientIp, userAgent } from '@/server/request';

export type ContactResult =
  | { ok: true }
  | { ok: false; error: 'rate_limited' | 'validation_failed' | 'challenge_failed' | 'server_error'; issues?: Record<string, string[]> };

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Widget not configured for this environment.
  if (!token) return false;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

/**
 * The public contact form.
 *
 * The browser validates with the same schema first, as a convenience; this is
 * where it counts. The enquiry lands in the admin panel's inbox. The visitor's
 * address and user agent are kept for abuse investigation only and are
 * stripped by the retention job (`npm run db:prune`).
 */
export async function submitContact(input: unknown): Promise<ContactResult> {
  const ip = await clientIp();

  // Five per ten minutes per address. Cloudflare and nginx limit in front of this.
  if (!hit(`contact:${ip}`, 5, 600).allowed) return { ok: false, error: 'rate_limited' };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'validation_failed', issues: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  // Honeypot: a filled hidden field means a bot, and a bot is told it worked.
  if (parsed.data.website) return { ok: true };

  if (!(await verifyTurnstile(parsed.data.token, ip))) return { ok: false, error: 'challenge_failed' };

  const data = parsed.data;
  try {
    run(
      `INSERT INTO contact_messages (name, email, phone, company, topic, subject, message, locale, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.phone || null,
        data.company || null,
        data.topic,
        data.subject,
        data.message,
        data.locale,
        ip,
        await userAgent(),
        now(),
      ],
    );
  } catch (error) {
    console.error('[contact] could not store enquiry', error);
    return { ok: false, error: 'server_error' };
  }

  return { ok: true };
}
