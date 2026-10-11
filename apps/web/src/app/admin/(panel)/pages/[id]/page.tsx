import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, LocalizedField } from '@/components/admin/fields';
import { MarkupHelp } from '@/components/admin/MarkupHelp';
import { PageHeader, Panel } from '@/components/admin/ui';
import { savePage } from '@/server/actions/content';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { fa, parseId, t } from '@/server/admin-data';
import { can } from '@/lib/roles';

export const metadata: Metadata = { title: 'ویرایش صفحه' };

export default async function EditLegalPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const id = parseId((await params).id);
  const page = id ? get<Row>('SELECT * FROM pages WHERE id = ?', [id]) : undefined;
  if (!page || !id) notFound();

  return (
    <>
      <PageHeader title={fa(page.title)} />
      <Panel>
        <AdminForm action={savePage.bind(null, id)} footer={<Link href="/admin/pages" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>}>
          <LocalizedField name="title" label="عنوان" values={t(page.title)} required />
          <LocalizedField name="meta_description" label="توضیح برای موتورهای جستجو" values={t(page.meta_description)} />
          <LocalizedField name="body" label="متن" values={t(page.body)} multiline rows={16} hint={<MarkupHelp />} />
          <CheckboxField
            name="is_published"
            label="منتشر در سایت"
            defaultChecked={Number(page.is_published) === 1}
            disabled={!can.publish(user.role)}
            hint={can.publish(user.role) ? undefined : 'انتشار با ویراستار یا مدیر است.'}
          />
        </AdminForm>
      </Panel>
    </>
  );
}
