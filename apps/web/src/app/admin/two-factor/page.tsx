import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/admin/AuthCard';
import { AdminForm } from '@/components/admin/AdminForm';
import { TextField } from '@/components/admin/fields';
import { requirePendingSession } from '@/server/auth';
import { verifySecondFactor } from '@/server/actions/auth';
import { LogoutButton } from '@/components/admin/LogoutButton';

export const metadata: Metadata = { title: 'تأیید دومرحله‌ای' };

export default async function TwoFactorPage() {
  const session = await requirePendingSession();
  if (!session.user.totpEnabled) redirect('/admin/two-factor/setup');
  if (session.twoFactorPassed) redirect('/admin');

  return (
    <AuthCard
      title="تأیید دومرحله‌ای"
      description="کد شش‌رقمی برنامه‌ی احراز هویت را وارد کنید. اگر به گوشی دسترسی ندارید، یکی از کدهای بازیابی را وارد کنید."
    >
      <AdminForm action={verifySecondFactor} submitLabel="تأیید">
        <TextField name="code" label="کد" dir="ltr" inputMode="numeric" autoComplete="one-time-code" required />
      </AdminForm>
      <LogoutButton className="mt-4" />
    </AuthCard>
  );
}
