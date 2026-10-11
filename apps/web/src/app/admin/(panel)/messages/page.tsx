import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader, RowLink, StatusBadge, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { faDateTime } from '@/lib/admin-format';
import { TOPIC_LABEL } from '@/lib/topics';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'پیام‌ها' };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requireAdmin('editor');
  const showAll = (await searchParams).all === '1';
  const rows = all<Row>(
    `SELECT id, name, email, topic, subject, locale, handled_at, created_at FROM contact_messages
     ${showAll ? '' : 'WHERE handled_at IS NULL'} ORDER BY created_at DESC LIMIT 500`,
  );

  return (
    <>
      <PageHeader
        title="پیام‌های فرم تماس"
        description="نشانی IP و مرورگر فرستنده فقط برای بررسی سوءاستفاده نگه داشته و پس از ۹۰ روز خودکار پاک می‌شود."
        actions={
          <div className="flex rounded-pill bg-ink-900/5 p-1 text-sm">
            <Link href="/admin/messages" className={cn('rounded-pill px-3 py-1', !showAll && 'bg-white shadow-sm')}>بی‌پاسخ</Link>
            <Link href="/admin/messages?all=1" className={cn('rounded-pill px-3 py-1', showAll && 'bg-white shadow-sm')}>همه</Link>
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>{showAll ? 'هنوز پیامی نرسیده است.' : 'پیام بی‌پاسخی نیست.'}</EmptyState>
      ) : (
        <Table head={['موضوع', 'فرستنده', 'دسته', 'زبان', 'زمان', 'وضعیت']}>
          {rows.map((row) => (
            <tr key={String(row.id)}>
              <td><RowLink href={`/admin/messages/${row.id}`}><span dir="auto">{String(row.subject)}</span></RowLink></td>
              <td><span dir="auto">{String(row.name)}</span></td>
              <td>{TOPIC_LABEL[String(row.topic)] ?? String(row.topic)}</td>
              <td className="uppercase">{String(row.locale)}</td>
              <td className="whitespace-nowrap">{faDateTime(row.created_at as string)}</td>
              <td>{row.handled_at ? <StatusBadge tone="muted">پاسخ داده شد</StatusBadge> : <StatusBadge tone="warn">بی‌پاسخ</StatusBadge>}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
