import type { Metadata } from 'next';
import { PageHeader, PublishedBadge, RowLink, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { fa } from '@/server/admin-data';
import { STAGE_LABELS } from '@/lib/minerals';
import { faNumber } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'مراحل تولید' };

export default async function StagesPage() {
  await requireAdmin();
  const rows = all<Row>('SELECT id, key, title, media_id, is_published, position FROM production_stages ORDER BY position, id');

  return (
    <>
      <PageHeader title="مراحل تولید" description="هشت مرحله‌ی خط تولید در صفحه‌ی کارخانه. عنوان و متن پیش‌فرض هر مرحله از ترجمه‌های سایت می‌آید؛ اینجا می‌توانید جایگزینش کنید و تصویر یا ویدیو بیفزایید." />
      <Table head={['ترتیب', 'مرحله', 'تصویر', 'وضعیت']}>
        {rows.map((row) => (
          <tr key={String(row.id)}>
            <td className="tabular-nums">{faNumber(Number(row.position) + 1)}</td>
            <td><RowLink href={`/admin/stages/${row.id}`}>{row.title ? fa(row.title) : (STAGE_LABELS[String(row.key)] ?? String(row.key))}</RowLink></td>
            <td>{row.media_id ? 'دارد' : '—'}</td>
            <td><PublishedBadge published={Number(row.is_published) === 1} /></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
