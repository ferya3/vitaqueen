import type { Metadata } from 'next';
import { CreatedNotice } from '@/components/admin/CreatedNotice';
import { EmptyState, NewButton, PageHeader, PublishedBadge, RowLink, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { fa } from '@/server/admin-data';

export const metadata: Metadata = { title: 'نمایندگان' };

export default async function DistributorsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const rows = all<Row>('SELECT id, company, region, country, city, is_published FROM distributors ORDER BY position, company');

  return (
    <>
      <PageHeader title="نمایندگان و پخش‌کنندگان" actions={<NewButton href="/admin/distributors/new" label="نماینده‌ی تازه" />} />
      {(await searchParams).created ? <CreatedNotice>نماینده ثبت شد.</CreatedNotice> : null}
      {rows.length === 0 ? (
        <EmptyState>هنوز نماینده‌ای ثبت نشده است.</EmptyState>
      ) : (
        <Table head={['شرکت', 'منطقه', 'کشور / شهر', 'وضعیت']}>
          {rows.map((row) => (
            <tr key={String(row.id)}>
              <td><RowLink href={`/admin/distributors/${row.id}`}>{String(row.company)}</RowLink></td>
              <td>{fa(row.region)}</td>
              <td>{String(row.country)}{row.city ? ` · ${row.city}` : ''}</td>
              <td><PublishedBadge published={Number(row.is_published) === 1} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
