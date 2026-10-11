'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { FormState } from '@/lib/form-state';
import { atLeast, isRole, requiresTwoFactor } from '@/lib/roles';
import { audit } from '@/server/audit';
import { endOtherSessions, requireAdmin } from '@/server/auth';
import { generatePassword, hashPassword, verifyPassword } from '../../../db/core.mjs';
import { get, now, run, type Row } from '@/server/db';
import { bool, localized, refreshSite, text } from '@/server/form';
import { deleteMedia, isFile, storeDocument, storeImage } from '@/server/media';
import { hit, isLimited } from '@/server/rate-limit';
import { decrypt } from '@/server/secrets';
import { verifyTotp } from '@/server/totp';
import { toStored } from '@/server/translations';
import { issueRecoveryCodes } from '@/server/two-factor';
import { hasErrors, invalid, uploadFailure } from './shared';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 12;

// --- Media library -------------------------------------------------------------------

export async function uploadMedia(_state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  if (!hit(`upload:${user.id}`, 60, 3600).allowed) return { error: 'بارگذاری‌های این ساعت به سقف رسید.' };

  const files = data.getAll('files').filter(isFile);
  if (files.length === 0) return invalid({ files: 'فایلی انتخاب نشده است.' });

  let stored = 0;
  try {
    for (const file of files) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) await storeDocument(file, user);
      else await storeImage(file, user);
      stored += 1;
    }
  } catch (error) {
    const result = uploadFailure(error, 'files');
    return stored ? { ...result, error: `${stored} فایل بارگذاری شد؛ ${result.error}` } : result;
  }

  revalidatePath('/admin/media');
  return { ok: true, message: `${stored} فایل بارگذاری شد.` };
}

export async function saveMediaAlt(id: number, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  if (!get('SELECT 1 FROM media WHERE id = ?', [id])) return { error: 'این فایل دیگر وجود ندارد.' };
  run('UPDATE media SET alt = ? WHERE id = ?', [toStored(localized(data, 'alt', 300)), id]);
  await audit('updated', { user, resourceType: 'media', resourceId: id, details: { fields: ['alt'] } });
  refreshSite();
  return { ok: true, message: 'ذخیره شد.' };
}

export async function removeMedia(id: number) {
  const user = await requireAdmin('editor');
  await deleteMedia(id, user);
  refreshSite();
  redirect('/admin/media');
}

// --- Enquiries -------------------------------------------------------------------------

export async function markMessageHandled(id: number, handled: boolean) {
  const user = await requireAdmin('editor');
  run('UPDATE contact_messages SET handled_at = ?, handled_by = ? WHERE id = ?', [handled ? now() : null, handled ? user.id : null, id]);
  await audit('message_handled', { user, resourceType: 'contact_message', resourceId: id, details: { handled } });
  revalidatePath('/admin', 'layout');
}

export async function deleteMessage(id: number) {
  const user = await requireAdmin('admin');
  run('DELETE FROM contact_messages WHERE id = ?', [id]);
  await audit('deleted', { user, resourceType: 'contact_message', resourceId: id });
  redirect('/admin/messages');
}

// --- Users -------------------------------------------------------------------------------

export async function saveUser(id: number | null, _state: FormState, data: FormData): Promise<FormState> {
  const actor = await requireAdmin('admin');
  const existing = id ? get<Row>('SELECT id, email, role, is_active FROM users WHERE id = ?', [id]) : undefined;
  if (id && !existing) return { error: 'این کاربر دیگر وجود ندارد.' };

  const name = text(data, 'name', 120);
  const email = text(data, 'email', 180).toLowerCase();
  const role = text(data, 'role', 32);
  const active = bool(data, 'is_active');
  const self = id === actor.id;

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'نام لازم است.';
  if (!EMAIL.test(email)) errors.email = 'ایمیل معتبر نیست.';
  else if (get('SELECT 1 FROM users WHERE email = ? AND id IS NOT ?', [email, id])) errors.email = 'این ایمیل قبلاً ثبت شده است.';
  if (!isRole(role)) errors.role = 'نقش نامعتبر است.';
  // Nobody hands out, or takes away, more power than they hold themselves.
  else if (!atLeast(actor.role, role)) errors.role = 'نمی‌توانید نقشی بالاتر از نقش خودتان بدهید.';
  if (existing && isRole(existing.role) && !atLeast(actor.role, existing.role)) return { error: 'این کاربر نقشی بالاتر از شما دارد.' };
  if (self && (role !== actor.role || !active)) errors.role = 'نقش یا وضعیت حساب خودتان را از اینجا نمی‌توانید تغییر دهید.';
  if (hasErrors(errors)) return invalid(errors);

  const timestamp = now();
  if (id) {
    run('UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = ? WHERE id = ?', [name, email, role, active, timestamp, id]);
    // A demoted or deactivated account must not keep a session minted under
    // its old rights.
    if (existing && (existing.role !== role || !active)) run('DELETE FROM sessions WHERE user_id = ?', [id]);
    await audit('updated', { user: actor, resourceType: 'user', resourceId: id, details: { email, role, active } });
    revalidatePath('/admin/users');
    return { ok: true, message: 'ذخیره شد.' };
  }

  const password = generatePassword();
  const userId = run(
    `INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, await hashPassword(password), role, active, timestamp, timestamp],
  ).id;
  await audit('user_created', { user: actor, resourceType: 'user', resourceId: userId, details: { email, role } });
  revalidatePath('/admin/users');

  return {
    ok: true,
    message: `حساب ${email} ساخته شد. رمز را از راهی امن به او بدهید؛ در اولین ورود تأیید دومرحله‌ای را فعال می‌کند.`,
    reveal: { label: 'رمز عبور اولیه (فقط همین یک بار نمایش داده می‌شود)', values: [password] },
  };
}

export async function resetUserPassword(id: number, _state: FormState, _data: FormData): Promise<FormState> {
  void _data;
  const actor = await requireAdmin('admin');
  const target = get<Row>('SELECT email, role FROM users WHERE id = ?', [id]);
  if (!target || !isRole(target.role)) return { error: 'این کاربر وجود ندارد.' };
  if (!atLeast(actor.role, target.role)) return { error: 'این کاربر نقشی بالاتر از شما دارد.' };

  const password = generatePassword();
  run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [await hashPassword(password), now(), id]);
  run('DELETE FROM sessions WHERE user_id = ?', [id]);
  await audit('password_reset', { user: actor, resourceType: 'user', resourceId: id, details: { email: target.email } });
  return { ok: true, message: 'رمز تازه ساخته شد و همه‌ی نشست‌های این کاربر بسته شد.', reveal: { label: 'رمز عبور تازه', values: [password] } };
}

export async function resetUserTwoFactor(id: number) {
  const actor = await requireAdmin('admin');
  const target = get<Row>('SELECT email, role FROM users WHERE id = ?', [id]);
  if (!target || !isRole(target.role) || !atLeast(actor.role, target.role)) return;
  run('UPDATE users SET totp_secret = NULL, totp_confirmed_at = NULL, totp_last_step = NULL, recovery_codes = NULL, updated_at = ? WHERE id = ?', [now(), id]);
  run('DELETE FROM sessions WHERE user_id = ?', [id]);
  await audit('two_factor_disabled', { user: actor, resourceType: 'user', resourceId: id, details: { email: target.email, by_admin: true } });
  revalidatePath(`/admin/users/${id}`);
}

export async function deleteUser(id: number) {
  const actor = await requireAdmin('super_admin');
  if (id === actor.id) return;
  const target = get<Row>('SELECT email FROM users WHERE id = ?', [id]);
  if (target) {
    run('DELETE FROM users WHERE id = ?', [id]);
    await audit('deleted', { user: actor, resourceType: 'user', resourceId: id, details: { email: target.email } });
  }
  redirect('/admin/users');
}

// --- Own account -------------------------------------------------------------------------

export async function changeOwnPassword(_state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const key = `password:${user.id}`;
  if (isLimited(key, 5)) return { error: 'تلاش‌های ناموفق زیاد بود. کمی بعد دوباره امتحان کنید.' };

  const current = text(data, 'current', 200);
  const next = text(data, 'password', 200);
  const confirm = text(data, 'confirm', 200);

  const row = get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [user.id]);
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    hit(key, 5, 900);
    return invalid({ current: 'رمز فعلی درست نیست.' });
  }

  const errors: Record<string, string> = {};
  if (next.length < MIN_PASSWORD) errors.password = `رمز تازه دست‌کم ${MIN_PASSWORD} نویسه باشد.`;
  else if (next === current) errors.password = 'رمز تازه باید با رمز فعلی فرق داشته باشد.';
  else if (next.toLowerCase().includes(user.email.split('@')[0].toLowerCase())) errors.password = 'رمز نباید نام کاربری را در خود داشته باشد.';
  if (confirm !== next) errors.confirm = 'تکرار رمز یکسان نیست.';
  if (hasErrors(errors)) return invalid(errors);

  run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [await hashPassword(next), now(), user.id]);
  await endOtherSessions(user.id, true);
  await audit('password_changed', { user });
  return { ok: true, message: 'رمز عوض شد و نشست‌های دیگر شما بسته شدند.' };
}

export async function updateOwnName(_state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const name = text(data, 'name', 120);
  if (!name) return invalid({ name: 'نام لازم است.' });
  run('UPDATE users SET name = ?, updated_at = ? WHERE id = ?', [name, now(), user.id]);
  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'ذخیره شد.' };
}

/** Both of these ask for a current code: a walked-away-from laptop is not enough. */
async function confirmCode(userId: number, code: string) {
  const row = get<{ totp_secret: string | null; totp_last_step: number | null }>('SELECT totp_secret, totp_last_step FROM users WHERE id = ?', [userId]);
  if (!row?.totp_secret) return false;
  const step = verifyTotp(decrypt(row.totp_secret), code, row.totp_last_step === null ? null : Number(row.totp_last_step));
  if (step === null) return false;
  run('UPDATE users SET totp_last_step = ? WHERE id = ?', [step, userId]);
  return true;
}

export async function regenerateRecoveryCodes(_state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin();
  if (isLimited(`2fa:${user.id}`, 6)) return { error: 'تلاش‌های ناموفق زیاد بود.' };
  if (!(await confirmCode(user.id, text(data, 'code', 20)))) {
    hit(`2fa:${user.id}`, 6, 300);
    return invalid({ code: 'کد درست نیست.' });
  }
  const codes = issueRecoveryCodes(user.id);
  return { ok: true, message: 'کدهای قبلی باطل شدند.', reveal: { label: 'کدهای بازیابی تازه', values: codes } };
}

export async function disableOwnTwoFactor(_state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin();
  if (requiresTwoFactor(user.role)) return { error: 'برای نقش شما تأیید دومرحله‌ای اجباری است.' };
  if (!(await confirmCode(user.id, text(data, 'code', 20)))) return invalid({ code: 'کد درست نیست.' });

  run('UPDATE users SET totp_secret = NULL, totp_confirmed_at = NULL, totp_last_step = NULL, recovery_codes = NULL WHERE id = ?', [user.id]);
  await audit('two_factor_disabled', { user });
  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'تأیید دومرحله‌ای غیرفعال شد.' };
}
