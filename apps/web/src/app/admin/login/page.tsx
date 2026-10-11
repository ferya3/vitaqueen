import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/admin/AuthCard';
import { AdminForm } from '@/components/admin/AdminForm';
import { TextField } from '@/components/admin/fields';
import { currentSession } from '@/server/auth';
import { login } from '@/server/actions/auth';

export const metadata: Metadata = { title: 'ورود' };

export default async function LoginPage() {
  const session = await currentSession();
  if (session?.twoFactorPassed || (session && !session.user.totpEnabled)) redirect('/admin');

  return (
    <AuthCard title="ورود به پنل مدیریت" description="با ایمیل و رمز عبور حساب مدیریت وارد شوید.">
      <AdminForm action={login} submitLabel="ورود">
        <TextField name="email" label="ایمیل" type="email" dir="ltr" autoComplete="username" inputMode="email" required />
        <TextField name="password" label="رمز عبور" type="password" dir="ltr" autoComplete="current-password" required />
      </AdminForm>
    </AuthCard>
  );
}
