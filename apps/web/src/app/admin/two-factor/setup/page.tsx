import type { Metadata } from 'next';
import { AuthCard } from '@/components/admin/AuthCard';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { TwoFactorSetup } from '@/components/admin/TwoFactorSetup';
import { requirePendingSession } from '@/server/auth';
import { get, run } from '@/server/db';
import { decrypt, encrypt } from '@/server/secrets';
import { generateTotpSecret, otpauthUri } from '@/server/totp';
import { requiresTwoFactor } from '@/lib/roles';

export const metadata: Metadata = { title: 'تأیید دومرحله‌ای' };

export default async function TwoFactorSetupPage() {
  const { user } = await requirePendingSession();

  let secret: string | null = null;
  if (!user.totpEnabled) {
    // Created once and kept until confirmed, so reloading the page does not
    // invalidate an app the user has already added it to.
    const row = get<{ totp_secret: string | null }>('SELECT totp_secret FROM users WHERE id = ?', [user.id]);
    secret = row?.totp_secret ? decrypt(row.totp_secret) : null;
    if (!secret) {
      secret = generateTotpSecret();
      run('UPDATE users SET totp_secret = ? WHERE id = ?', [encrypt(secret), user.id]);
    }
  }

  return (
    <AuthCard
      title="تأیید دومرحله‌ای"
      description={
        user.totpEnabled
          ? undefined
          : requiresTwoFactor(user.role)
            ? 'برای نقش شما ورود بدون تأیید دومرحله‌ای ممکن نیست. یک‌بار تنظیمش کنید.'
            : 'لایه‌ی دوم امنیتی برای حساب شما.'
      }
    >
      <TwoFactorSetup enabled={user.totpEnabled} secret={secret} uri={secret ? otpauthUri(secret, user.email) : null} />
      <LogoutButton className="mt-6" />
    </AuthCard>
  );
}
