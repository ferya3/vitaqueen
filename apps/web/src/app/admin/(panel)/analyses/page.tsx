import type { Metadata } from 'next';
import { EmptyState, NewButton, PageHeader, PublishedBadge, RowLink, StatusBadge, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { faDate, faNumber } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'آنالیز آب' };

export default async function AnalysesPage() {
  await requireAdmin();
  const rows = all<Row>('SELECT id, sampling_point, sampled_at, laboratory, ph, tds, is_sample, is_published FROM water_analyses ORDER BY sampled_at DESC, id DESC');
  const currentId = rows.find((row) => Number(row.is_published) === 1)?.id;

  return (
    <>
      <PageHeader
        title="آنالیز آب"
        description="سایت جدیدترین آنالیز منتشرشده را در صفحه‌های کیفیت، چشمه و محصولات نشان می‌دهد."
        actions={<NewButton href="/admin/analyses/new" label="آنالیز تازه" />}
      />
      {rows.length === 0 ? (
        <EmptyState>هنوز آنالیزی ثبت نشده است.</EmptyState>
      ) : (
        <Table head={['تاریخ نمونه', 'محل', 'آزمایشگاه', 'pH', 'TDS', 'وضعیت']}>
          {rows.map((row) => (
            <tr key={String(row.id)}>
              <td>
                <RowLink href={`/admin/analyses/${row.id}`}>{faDate(row.sampled_at as string)}</RowLink>
                {row.id === currentId ? <span className="ms-2"><StatusBadge tone="live">نمایش در سایت</StatusBadge></span> : null}
              </td>
              <td dir="ltr" className="text-end">{String(row.sampling_point)}</td>
              <td>{(row.laboratory as string) ?? '—'}</td>
              <td className="tabular-nums">{faNumber(Number(row.ph))}</td>
              <td className="tabular-nums">{faNumber(Number(row.tds))}</td>
              <td className="flex flex-wrap gap-1">
                <PublishedBadge published={Number(row.is_published) === 1} />
                {Number(row.is_sample) === 1 ? <StatusBadge tone="warn">داده‌ی نمونه</StatusBadge> : null}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
