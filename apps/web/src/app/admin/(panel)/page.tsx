import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Award, FlaskConical, Inbox, Newspaper, Package, Truck } from 'lucide-react';
import { PageHeader, Panel, RowLink } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, get, now, run } from '@/server/db';
import { faDateTime, faNumber } from '@/lib/admin-format';
import { can } from '@/lib/roles';

export const metadata: Metadata = { title: 'داشبورد' };

const count = (sql: string) => Number(get<{ n: number }>(sql)?.n ?? 0);

/**
 * Retention runs from here at most once a day, so it happens on an install
 * where nobody set up a cron job. `npm run db:prune` does the same by hand.
 */
function pruneIfDue() {
  const last = get<{ value: string }>(`SELECT value FROM meta WHERE key = 'pruned_at'`)?.value;
  if (last && Date.parse(last) > Date.now() - 86_400_000) return;

  const auditDays = Number(process.env.AUDIT_RETENTION_DAYS || 730);
  const piiDays = Number(process.env.CONTACT_PII_RETENTION_DAYS || 90);
  run('DELETE FROM audit_logs WHERE created_at < ?', [new Date(Date.now() - auditDays * 86_400_000).toISOString()]);
  run(
    'UPDATE contact_messages SET ip_address = NULL, user_agent = NULL WHERE created_at < ? AND (ip_address IS NOT NULL OR user_agent IS NOT NULL)',
    [new Date(Date.now() - piiDays * 86_400_000).toISOString()],
  );
  run('DELETE FROM sessions WHERE expires_at < ?', [now()]);
  run('DELETE FROM rate_limits WHERE reset_at < ?', [Date.now()]);
  run(`INSERT INTO meta (key, value) VALUES ('pruned_at', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`, [now()]);
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAdmin();
  pruneIfDue();

  const sampleAnalysis = count('SELECT count(*) AS n FROM water_analyses WHERE is_published = 1 AND is_sample = 1') > 0;
  const sampleSource = count('SELECT count(*) AS n FROM source_profile WHERE is_sample = 1') > 0;
  const unpublishedLegal = all<{ slug: string }>('SELECT slug FROM pages WHERE is_published = 0');
  const messages = can.readMessages(user.role)
    ? all<{ id: number; name: string; subject: string; created_at: string }>(
        'SELECT id, name, subject, created_at FROM contact_messages WHERE handled_at IS NULL ORDER BY created_at DESC LIMIT 6',
      )
    : [];

  const tiles = [
    { label: 'محصولات منتشرشده', value: count('SELECT count(*) AS n FROM products WHERE is_published = 1'), href: '/admin/products', icon: Package },
    { label: 'گواهی‌نامه‌های معتبر', value: count(`SELECT count(*) AS n FROM certificates WHERE is_published = 1 AND (valid_until IS NULL OR valid_until >= date('now'))`), href: '/admin/certificates', icon: Award },
    { label: 'آنالیزهای منتشرشده', value: count('SELECT count(*) AS n FROM water_analyses WHERE is_published = 1'), href: '/admin/analyses', icon: FlaskConical },
    { label: 'اخبار منتشرشده', value: count('SELECT count(*) AS n FROM news_articles WHERE is_published = 1'), href: '/admin/news', icon: Newspaper },
    { label: 'نمایندگان', value: count('SELECT count(*) AS n FROM distributors WHERE is_published = 1'), href: '/admin/distributors', icon: Truck },
    ...(can.readMessages(user.role)
      ? [{ label: 'پیام‌های بی‌پاسخ', value: count('SELECT count(*) AS n FROM contact_messages WHERE handled_at IS NULL'), href: '/admin/messages', icon: Inbox }]
      : []),
  ];

  const warnings = [
    sampleAnalysis && { text: 'آنالیز آب منتشرشده هنوز داده‌ی نمونه است و سایت این را به بازدیدکننده اعلام می‌کند. نتیجه‌ی واقعی آزمایشگاه را ثبت کنید.', href: '/admin/analyses' },
    sampleSource && { text: 'مشخصات چشمه هنوز داده‌ی نمونه است.', href: '/admin/source' },
    unpublishedLegal.length > 0 && { text: `صفحات حقوقی منتشرنشده: ${unpublishedLegal.map((page) => page.slug).join('، ')}`, href: '/admin/pages' },
  ].filter(Boolean) as Array<{ text: string; href: string }>;

  return (
    <>
      <PageHeader title={`سلام، ${user.name}`} description="نمای کلی محتوای سایت." />

      {(await searchParams).denied ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">نقش شما به آن بخش دسترسی ندارد.</p>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mb-6 grid gap-2">
          {warnings.map((warning) => (
            <Link key={warning.href} href={warning.href} className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {warning.text}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="glass flex items-center gap-4 rounded-xl p-5 transition-shadow hover:shadow-float">
            <span className="grid size-11 place-items-center rounded-lg bg-aqua-500/12 text-aqua-700">
              <tile.icon className="size-5" />
            </span>
            <span>
              <span className="block text-2xl font-bold tabular-nums text-heading">{faNumber(tile.value)}</span>
              <span className="text-sm text-ink-500">{tile.label}</span>
            </span>
          </Link>
        ))}
      </div>

      {messages.length > 0 ? (
        <Panel className="mt-8">
          <h2 className="mb-3 font-semibold text-heading">آخرین پیام‌های بی‌پاسخ</h2>
          <ul className="divide-y divide-hairline">
            {messages.map((message) => (
              <li key={message.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                <RowLink href={`/admin/messages/${message.id}`}>
                  {message.subject} — {message.name}
                </RowLink>
                <span className="text-xs text-ink-400">{faDateTime(message.created_at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </>
  );
}
