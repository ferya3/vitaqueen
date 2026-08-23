import { NextResponse, type NextRequest } from 'next/server';
import { contactSchema } from '@/lib/contact-schema';
import { serverConfig } from '@/config/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * In-process rate limiter.
 *
 * This is the first of several gates, not the only one: it stops a single
 * browser from hammering the endpoint, but it is per-instance and resets on
 * deploy. The authoritative limits live in Laravel (Redis-backed) and at
 * Cloudflare; see `docs/security.md`.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((time) => now - time > WINDOW_MS)) hits.delete(k);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

function clientIp(request: NextRequest) {
  // Behind Cloudflare and nginx the real address arrives in a header. The
  // origin must not be reachable directly, or these can be spoofed.
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Widget not configured for this environment.
  if (!token) return false;

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
    cache: 'no-store',
  });

  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  // Honeypot: a filled hidden field means a bot, and a bot gets a silent 204.
  if (parsed.data.website) {
    return new NextResponse(null, { status: 204 });
  }

  if (!(await verifyTurnstile(parsed.data.token, ip))) {
    return NextResponse.json({ error: 'challenge_failed' }, { status: 403 });
  }

  const { consent, website, token, ...payload } = parsed.data;
  void consent;
  void website;
  void token;

  try {
    const upstream = await fetch(`${serverConfig.apiUrl}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Language': payload.locale,
        'X-Forwarded-For': ip,
        ...(serverConfig.apiToken ? { Authorization: `Bearer ${serverConfig.apiToken}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      // Never echo the upstream body: it can carry stack traces or field names
      // the public form has no business learning.
      console.error('[contact] upstream rejected submission', upstream.status);
      return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error('[contact] upstream unreachable', error);
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }
}
