import type { Metadata } from 'next';
import { EmptyState, NewButton, PageHeader, PublishedBadge, RowLink, StatusBadge, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { fa } from '@/server/admin-data';
import { faDate } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'اخبار' };

export default async function NewsPage() {
  await requireAdmin();
  const rows = all<Row>('SELECT id, slug, title, published_at, is_published FROM news_articles ORDER BY coalesce(published_at, created_at) DESC');
  const nowIso = new Date().toISOString();

  return (
    <>
      <PageHeader title="اخبار" actions={<NewButton href="/admin/news/new" label="خبر تازه" />} />
      {rows.length === 0 ? (
        <EmptyState>هنوز خبری نوشته نشده است.</EmptyState>
      ) : (
        <Table head={['عنوان', 'نامک', 'تاریخ انتشار', 'وضعیت']}>
          {rows.map((row) => (
            <tr key={String(row.id)}>
              <td><RowLink href={`/admin/news/${row.id}`}>{fa(row.title)}</RowLink></td>
              <td dir="ltr" className="text-end font-mono text-xs">{String(row.slug)}</td>
              <td>{faDate(row.published_at as string)}</td>
              <td>
                {Number(row.is_published) === 1 && row.published_at && String(row.published_at) > nowIso ? (
                  <StatusBadge tone="warn">زمان‌بندی‌شده</StatusBadge>
                ) : (
                  <PublishedBadge published={Number(row.is_published) === 1} />
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
