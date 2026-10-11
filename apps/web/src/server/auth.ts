import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes } from 'node:crypto';
import { get, now, run } from './db';
import { sha256 } from './secrets';
import { clientIp, isSecureRequest, userAgent } from './request';
import { atLeast, isRole, requiresTwoFactor, type Role } from '@/lib/roles';

/**
 * Admin sessions.
 *
 * The cookie holds 32 random bytes; the database holds only their SHA-256.
 * A stolen database therefore contains no usable session, and signing a user
 * out everywhere is one DELETE. The cookie is scoped to `/admin`, so the
 * public site never sees it.
 */
const COOKIE = 'vq_admin';
const ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  totpEnabled: boolean;
};

type Session = {
  id: string;
  user: AdminUser;
  twoFactorPassed: boolean;
};

type SessionRow = {
  id: string;
  user_id: number;
  two_factor_passed: number;
  last_seen_at: string;
  expires_at: string;
  name: string;
  email: string;
  role: string;
  is_active: number;
  totp_confirmed_at: string | null;
};

/** Creates a session and sets its cookie. Server Actions only. */
export async function startSession(userId: number, twoFactorPassed: boolean) {
  const token = randomBytes(32).toString('base64url');
  const timestamp = now();
  const expires = new Date(Date.now() + ABSOLUTE_LIFETIME_MS);

  run(
    `INSERT INTO sessions (id, user_id, two_factor_passed, ip_address, user_agent, created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sha256(token), userId, twoFactorPassed ? 1 : 0, await clientIp(), await userAgent(), timestamp, timestamp, expires.toISOString()],
  );

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/admin',
    // Only over TLS. Testing on a bare IP over plain HTTP still works, but the
    // cookie is never marked secure there because the browser would drop it.
    secure: await isSecureRequest(),
    expires,
  });
}

/** Reads and validates the current session. Memoised per request. */
export const currentSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;

  const row = get<SessionRow>(
    `SELECT s.id, s.user_id, s.two_factor_passed, s.last_seen_at, s.expires_at,
            u.name, u.email, u.role, u.is_active, u.totp_confirmed_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [sha256(token)],
  );
  if (!row) return null;

  const nowMs = Date.now();
  const expired =
    Date.parse(row.expires_at) <= nowMs ||
    Date.parse(row.last_seen_at) + IDLE_TIMEOUT_MS <= nowMs ||
    Number(row.is_active) !== 1 ||
    !isRole(row.role);

  if (expired) {
    run('DELETE FROM sessions WHERE id = ?', [row.id]);
    return null;
  }

  // Sliding idle window, written at most once a minute.
  if (Date.parse(row.last_seen_at) + 60_000 < nowMs) {
    run('UPDATE sessions SET last_seen_at = ? WHERE id = ?', [now(), row.id]);
  }

  return {
    id: row.id,
    twoFactorPassed: Number(row.two_factor_passed) === 1,
    user: {
      id: Number(row.user_id),
      name: row.name,
      email: row.email,
      role: row.role as Role,
      totpEnabled: row.totp_confirmed_at !== null,
    },
  };
});

/**
 * The gate in front of every admin page and every Server Action.
 *
 * Server Actions are public HTTP endpoints regardless of which page renders
 * the form, so each one calls this itself; hiding a button is not access
 * control.
 */
export async function requireAdmin(minimum: Role = 'content_manager'): Promise<AdminUser> {
  const session = await currentSession();
  if (!session) redirect('/admin/login');

  const { user } = session;
  if (user.totpEnabled && !session.twoFactorPassed) redirect('/admin/two-factor');
  if (!user.totpEnabled && requiresTwoFactor(user.role)) redirect('/admin/two-factor/setup');
  if (!atLeast(user.role, minimum)) redirect('/admin?denied=1');

  return user;
}

/** For the second-factor screens, which a half-signed-in user must reach. */
export async function requirePendingSession(): Promise<Session> {
  const session = await currentSession();
  if (!session) redirect('/admin/login');
  return session;
}

/**
 * Marks the session as having passed the second factor, under a new token.
 * Rotating here means a token captured before the second factor was given is
 * worth nothing afterwards.
 */
export async function upgradeSession() {
  const session = await currentSession();
  if (!session) redirect('/admin/login');
  run('DELETE FROM sessions WHERE id = ?', [session.id]);
  await startSession(session.user.id, true);
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) run('DELETE FROM sessions WHERE id = ?', [sha256(token)]);
  store.delete({ name: COOKIE, path: '/admin' });
}

/** Signs a user out everywhere, optionally keeping the caller's own session. */
export async function endOtherSessions(userId: number, keepCurrent: boolean) {
  const session = keepCurrent ? await currentSession() : null;
  run('DELETE FROM sessions WHERE user_id = ? AND id IS NOT ?', [userId, session?.id ?? null]);
}
