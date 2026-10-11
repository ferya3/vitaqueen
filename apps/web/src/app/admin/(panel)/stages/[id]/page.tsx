import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, FileField, LocalizedField, TextField } from '@/components/admin/fields';
import { PageHeader, Panel } from '@/components/admin/ui';
import { saveStage } from '@/server/actions/quality';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { mediaInfo, parseId, t } from '@/server/admin-data';
import { STAGE_LABELS } from '@/lib/minerals';
import { can } from '@/lib/roles';

export const metadata: Metadata = { title: 'ویرایش مرحله' };

export default async function StagePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const id = parseId((await params).id);
  const stage = id ? get<Row>('SELECT * FROM production_stages WHERE id = ?', [id]) : undefined;
  if (!stage || !id) notFound();

  return (
    <>
      <PageHeader title={STAGE_LABELS[String(stage.key)] ?? String(stage.key)} />
      <Panel>
        <AdminForm action={saveStage.bind(null, id)} footer={<Link href="/admin/stages" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>}>
          <LocalizedField name="title" label="عنوان (اختیاری)" values={t(stage.title)} hint="خالی بماند تا عنوان استاندارد ترجمه‌شده نمایش داده شود." />
          <LocalizedField name="body" label="متن (اختیاری)" values={t(stage.body)} multiline rows={3} />
          <FileField name="image" label="تصویر" accept="image/*" current={mediaInfo(stage.media_id)} removeName="remove_image" />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="video_webm_url" label="ویدیو WebM" defaultValue={stage.video_webm_url as string} dir="ltr" hint="نشانی https:// یا مسیر /" />
            <TextField name="video_mp4_url" label="ویدیو MP4" defaultValue={stage.video_mp4_url as string} dir="ltr" />
            <TextField name="position" label="ترتیب" defaultValue={Number(stage.position)} dir="ltr" inputMode="numeric" />
          </div>
          <CheckboxField name="is_published" label="نمایش در سایت" defaultChecked={Number(stage.is_published) === 1} disabled={!can.publish(user.role)} />
        </AdminForm>
      </Panel>
    </>
  );
}
