import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { TextField } from '@/components/admin/fields';
import { PageHeader, Panel } from '@/components/admin/ui';
import { changeOwnPassword, disableOwnTwoFactor, regenerateRecoveryCodes, updateOwnName } from '@/server/actions/admin';
import { requireAdmin } from '@/server/auth';
import { ROLE_LABEL, requiresTwoFactor } from '@/lib/roles';

export const metadata: Metadata = { title: 'حساب من' };

export default async function AccountPage() {
  const user = await requireAdmin();

  return (
    <>
      <PageHeader title="حساب من" description={`${user.email} · ${ROLE_LABEL[user.role]}`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold text-heading">نام</h2>
          <AdminForm action={updateOwnName}>
            <TextField name="name" label="نام نمایشی" defaultValue={user.name} required />
          </AdminForm>
        </Panel>

        <Panel>
          <h2 className="mb-4 font-semibold text-heading">تغییر رمز عبور</h2>
          <AdminForm action={changeOwnPassword} submitLabel="تغییر رمز">
            <TextField name="current" label="رمز فعلی" type="password" dir="ltr" autoComplete="current-password" required />
            <TextField name="password" label="رمز تازه" type="password" dir="ltr" autoComplete="new-password" required hint="دست‌کم ۱۲ نویسه. یک عبارت چندکلمه‌ای از یک کلمه‌ی پیچیده بهتر است." />
            <TextField name="confirm" label="تکرار رمز تازه" type="password" dir="ltr" autoComplete="new-password" required />
          </AdminForm>
        </Panel>

        <Panel>
          <h2 className="mb-2 font-semibold text-heading">تأیید دومرحله‌ای</h2>
          {user.totpEnabled ? (
            <div className="grid gap-6">
              <AdminForm action={regenerateRecoveryCodes} submitLabel="ساخت کدهای بازیابی تازه">
                <p className="text-sm text-ink-600">کدهای قبلی باطل می‌شوند. برای تأیید، کد فعلی برنامه را وارد کنید.</p>
                <TextField name="code" label="کد شش‌رقمی" dir="ltr" inputMode="numeric" autoComplete="one-time-code" required />
              </AdminForm>
              {!requiresTwoFactor(user.role) ? (
                <AdminForm action={disableOwnTwoFactor} submitLabel="غیرفعال کردن" confirm="تأیید دومرحله‌ای غیرفعال شود؟">
                  <TextField name="code" label="کد شش‌رقمی برای غیرفعال کردن" dir="ltr" inputMode="numeric" autoComplete="one-time-code" required />
                </AdminForm>
              ) : (
                <p className="text-xs text-ink-400">برای نقش شما تأیید دومرحله‌ای اجباری است و غیرفعال نمی‌شود.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-600">
              فعال نیست.{' '}
              <Link href="/admin/two-factor/setup" className="font-semibold text-aqua-700 hover:underline">فعال‌سازی</Link>
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
