import Link from 'next/link';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { AdminNav } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { Logo } from '@/components/ui/Logo';
import { requireAdmin } from '@/server/auth';
import { get } from '@/server/db';
import { ROLE_LABEL, can } from '@/lib/roles';

/** Every page under here is per-user and must never be served from a cache. */
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const unread = can.readMessages(user.role)
    ? Number(get<{ n: number }>('SELECT count(*) AS n FROM contact_messages WHERE handled_at IS NULL')?.n ?? 0)
    : 0;

  return (
    <div className="mx-auto grid min-h-dvh max-w-[90rem] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 lg:px-6 lg:py-6">
      <aside className="min-w-0 lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto">
        <div className="glass-strong flex flex-col gap-4 rounded-xl p-3 lg:min-h-full lg:p-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <Link href="/admin" className="text-heading">
              <Logo label="VitaQueen" className="[&>span]:text-base" />
            </Link>
            <Link href="/fa" target="_blank" className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-aqua-700">
              سایت
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
          <AdminNav role={user.role} unread={unread} />
          <div className="mt-auto hidden border-t border-hairline pt-4 lg:block">
            <p className="truncate text-sm font-medium text-heading">{user.name}</p>
            <p className="truncate text-xs text-ink-400">{ROLE_LABEL[user.role]}</p>
            <LogoutButton className="mt-3" />
          </div>
        </div>
      </aside>

      <main className="min-w-0 pb-16">
        {!user.totpEnabled ? (
          <p className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <ShieldAlert className="size-4" />
            تأیید دومرحله‌ای برای حساب شما فعال نیست.
            <Link href="/admin/two-factor/setup" className="font-semibold underline underline-offset-2">
              فعال‌سازی
            </Link>
          </p>
        ) : null}
        {children}
        <div className="mt-10 flex items-center justify-between border-t border-hairline pt-4 text-sm lg:hidden">
          <span className="text-ink-500">
            {user.name} · {ROLE_LABEL[user.role]}
          </span>
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
