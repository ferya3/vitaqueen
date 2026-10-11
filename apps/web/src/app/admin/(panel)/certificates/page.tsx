import type { Metadata } from 'next';
import { EmptyState, NewButton, PageHeader, PublishedBadge, RowLink, StatusBadge, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { fa } from '@/server/admin-data';
import { faDate } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'گواهی‌نامه‌ها' };

export default async function CertificatesPage() {
  await requireAdmin();
  const rows = all<Row>('SELECT id, title, issuer, number, valid_until, is_published FROM certificates ORDER BY position, id');
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="گواهی‌نامه‌ها" description="در صفحه‌ی کیفیت و صفحه‌ی هر محصول نمایش داده می‌شوند." actions={<NewButton href="/admin/certificates/new" label="گواهی‌نامه‌ی تازه" />} />
      {rows.length === 0 ? (
        <EmptyState>هنوز گواهی‌نامه‌ای ثبت نشده است. صفحه‌ی کیفیت تا آن زمان پیام «در حال به‌روزرسانی» نشان می‌دهد.</EmptyState>
      ) : (
        <Table head={['عنوان', 'صادرکننده', 'شماره', 'اعتبار', 'وضعیت']}>
          {rows.map((row) => {
            const expired = row.valid_until && String(row.valid_until) < today;
            return (
              <tr key={String(row.id)}>
                <td><RowLink href={`/admin/certificates/${row.id}`}>{fa(row.title)}</RowLink></td>
                <td>{fa(row.issuer)}</td>
                <td dir="ltr" className="text-end font-mono text-xs">{(row.number as string) ?? '—'}</td>
                <td>{expired ? <StatusBadge tone="warn">منقضی</StatusBadge> : faDate(row.valid_until as string)}</td>
                <td><PublishedBadge published={Number(row.is_published) === 1} /></td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
