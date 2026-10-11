import type { Metadata } from 'next';
import { PageHeader, PublishedBadge, RowLink, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { fa } from '@/server/admin-data';
import { faDateTime } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'صفحات حقوقی' };

export default async function PagesPage() {
  await requireAdmin();
  const rows = all<Row>('SELECT id, slug, title, is_published, updated_at FROM pages ORDER BY slug');

  return (
    <>
      <PageHeader
        title="صفحات حقوقی"
        description="حریم خصوصی، شرایط استفاده و سیاست کوکی. تا وقتی متن واقعی نوشته و منتشر نشده، سایت پیام «منتشر نشده» نشان می‌دهد؛ متن ساختگی هرگز جای آن را نمی‌گیرد."
      />
      <Table head={['صفحه', 'نشانی', 'آخرین ویرایش', 'وضعیت']}>
        {rows.map((row) => (
          <tr key={String(row.id)}>
            <td><RowLink href={`/admin/pages/${row.id}`}>{fa(row.title)}</RowLink></td>
            <td dir="ltr" className="text-end font-mono text-xs">/legal/{String(row.slug)}</td>
            <td>{faDateTime(row.updated_at as string)}</td>
            <td><PublishedBadge published={Number(row.is_published) === 1} /></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
