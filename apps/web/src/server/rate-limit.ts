import 'server-only';
import { get, run } from './db';

/**
 * Fixed-window counter stored in SQLite.
 *
 * In the database rather than in memory so that a pm2 restart, a deploy or
 * cluster mode does not hand an attacker a fresh budget. Cloudflare and nginx
 * have their own limits in front of this one; this is the layer that knows
 * which account a login attempt was aimed at.
 */
export function hit(key: string, limit: number, windowSeconds: number) {
  const nowMs = Date.now();
  const row = get<{ hits: number; reset_at: number }>('SELECT hits, reset_at FROM rate_limits WHERE key = ?', [key]);

  if (!row || Number(row.reset_at) <= nowMs) {
    const resetAt = nowMs + windowSeconds * 1000;
    run(
      `INSERT INTO rate_limits (key, hits, reset_at) VALUES (?, 1, ?)
       ON CONFLICT (key) DO UPDATE SET hits = 1, reset_at = excluded.reset_at`,
      [key, resetAt],
    );
    return { allowed: true, retryAfter: 0 };
  }

  run('UPDATE rate_limits SET hits = hits + 1 WHERE key = ?', [key]);
  const hits = Number(row.hits) + 1;
  return {
    allowed: hits <= limit,
    retryAfter: Math.ceil((Number(row.reset_at) - nowMs) / 1000),
  };
}

/** Peek without counting: used to refuse before doing expensive work. */
export function isLimited(key: string, limit: number) {
  const row = get<{ hits: number; reset_at: number }>('SELECT hits, reset_at FROM rate_limits WHERE key = ?', [key]);
  return !!row && Number(row.reset_at) > Date.now() && Number(row.hits) >= limit;
}

export function clear(key: string) {
  run('DELETE FROM rate_limits WHERE key = ?', [key]);
}
