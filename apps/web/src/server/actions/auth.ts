'use server';

import { redirect } from 'next/navigation';
import { get, now, run } from '@/server/db';
import { hashPassword, needsRehash, verifyPassword } from '../../../db/core.mjs';
import { endSession, requirePendingSession, startSession, upgradeSession, currentSession } from '@/server/auth';
import { audit } from '@/server/audit';
import { clear, hit, isLimited } from '@/server/rate-limit';
import { clientIp } from '@/server/request';
import { decrypt, encrypt, sha256 } from '@/server/secrets';
import { verifyTotp } from '@/server/totp';
import { issueRecoveryCodes } from '@/server/two-factor';
import { text } from '@/server/form';
import type { FormState } from '@/lib/form-state';

/**
 * Verifying against this when the email is unknown makes a miss cost the same
 * time as a wrong password, so response timing does not reveal which emails
 * have accounts.
 */
let dummyHash: Promise<string> | null = null;

const LOGIN_FAILED = 'ایمیل یا رمز عبور نادرست است.';
const TOO_MANY = 'تلاش‌های ناموفق زیاد بود. چند دقیقه‌ی دیگر دوباره امتحان کنید.';

export async function login(_state: FormState, data: FormData): Promise<FormState> {
  const email = text(data, 'email', 180).toLowerCase();
  const password = text(data, 'password', 200);
  const ip = await clientIp();

  // Two buckets: one per address (spraying many accounts) and one per account
  // (guessing one account from many addresses).
  const ipKey = `login:ip:${ip}`;
  const accountKey = `login:account:${email}`;
  if (isLimited(ipKey, 20) || isLimited(accountKey, 8)) return { error: TOO_MANY };

  if (!email || !password) return { error: LOGIN_FAILED };

  const user = get<{ id: number; email: string; password_hash: string; is_active: number; totp_confirmed_at: string | null }>(
    'SELECT id, email, password_hash, is_active, totp_confirmed_at FROM users WHERE email = ?',
    [email],
  );

  dummyHash ??= hashPassword('timing-equaliser-not-a-real-password');
  const valid = await verifyPassword(password, user?.password_hash ?? (await dummyHash));

  if (!user || !valid || Number(user.is_active) !== 1) {
    hit(ipKey, 20, 900);
    hit(accountKey, 8, 900);
    await audit('login_failed', { email, details: { reason: !user ? 'unknown_email' : !valid ? 'bad_password' : 'inactive' } });
    return { error: LOGIN_FAILED };
  }

  clear(accountKey);

  if (needsRehash(user.password_hash)) {
    run('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(password), user.id]);
  }
  run('UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?', [now(), ip, user.id]);
  await audit('login_succeeded', { user, details: { second_factor_pending: user.totp_confirmed_at !== null } });

  await startSession(user.id, false);
  redirect(user.totp_confirmed_at ? '/admin/two-factor' : '/admin');
}

export async function logout() {
  const session = await currentSession();
  if (session) await audit('logged_out', { user: session.user });
  await endSession();
  redirect('/admin/login');
}

type TotpRow = { totp_secret: string | null; totp_last_step: number | null; recovery_codes: string | null };

/** The second step of signing in: a code from the app, or a recovery code. */
export async function verifySecondFactor(_state: FormState, data: FormData): Promise<FormState> {
  const session = await requirePendingSession();
  const { user } = session;
  if (session.twoFactorPassed || !user.totpEnabled) redirect('/admin');

  const key = `2fa:${user.id}`;
  if (isLimited(key, 6)) return { error: TOO_MANY };

  const code = text(data, 'code', 40).replace(/\s+/g, '').toLowerCase();
  const row = get<TotpRow>('SELECT totp_secret, totp_last_step, recovery_codes FROM users WHERE id = ?', [user.id]);
  if (!row?.totp_secret) redirect('/admin/two-factor/setup');

  const step = verifyTotp(decrypt(row.totp_secret), code, row.totp_last_step === null ? null : Number(row.totp_last_step));
  if (step !== null) {
    run('UPDATE users SET totp_last_step = ? WHERE id = ?', [step, user.id]);
  } else if (!consumeRecoveryCode(user.id, row.recovery_codes, code)) {
    hit(key, 6, 300);
    await audit('two_factor_failed', { user });
    return { error: 'کد درست نیست یا منقضی شده است.' };
  } else {
    await audit('recovery_code_used', { user });
  }

  clear(key);
  await upgradeSession();
  redirect('/admin');
}

function consumeRecoveryCode(userId: number, stored: string | null, code: string) {
  if (!stored || !/^[a-z2-7]{5}-?[a-z2-7]{5}$/.test(code)) return false;
  const normalised = code.includes('-') ? code : `${code.slice(0, 5)}-${code.slice(5)}`;
  const hashes = JSON.parse(decrypt(stored)) as string[];
  const index = hashes.indexOf(sha256(normalised));
  if (index === -1) return false;
  hashes.splice(index, 1);
  run('UPDATE users SET recovery_codes = ? WHERE id = ?', [encrypt(JSON.stringify(hashes)), userId]);
  return true;
}

/** Confirms enrolment: the code proves the app and the server share a secret. */
export async function confirmTwoFactorSetup(_state: FormState, data: FormData): Promise<FormState> {
  const { user } = await requirePendingSession();
  if (user.totpEnabled) redirect('/admin');

  const key = `2fa:${user.id}`;
  if (isLimited(key, 6)) return { error: TOO_MANY };

  const row = get<TotpRow>('SELECT totp_secret FROM users WHERE id = ?', [user.id]);
  if (!row?.totp_secret) return { error: 'صفحه را دوباره باز کنید.' };

  const step = verifyTotp(decrypt(row.totp_secret), text(data, 'code', 20));
  if (step === null) {
    hit(key, 6, 300);
    return { error: 'کد درست نیست. ساعت گوشی را بررسی کنید و کد تازه را وارد کنید.' };
  }

  run('UPDATE users SET totp_confirmed_at = ?, totp_last_step = ?, updated_at = ? WHERE id = ?', [now(), step, now(), user.id]);
  const codes = issueRecoveryCodes(user.id);
  await audit('two_factor_enabled', { user });
  await upgradeSession();

  return {
    ok: true,
    message: 'تأیید دومرحله‌ای فعال شد.',
    reveal: { label: 'کدهای بازیابی (هر کد یک بار؛ فقط همین حالا نمایش داده می‌شوند)', values: codes },
  };
}
