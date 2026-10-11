import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, FileField, FormSection, LocalizedField, TextField } from '@/components/admin/fields';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { Panel } from '@/components/admin/ui';
import { deleteCertificate, saveCertificate } from '@/server/actions/content';
import { mediaInfo, t } from '@/server/admin-data';
import type { Row } from '@/server/db';
import { can, type Role } from '@/lib/roles';

export function CertificateForm({ certificate, role }: { certificate?: Row; role: Role }) {
  const id = certificate ? Number(certificate.id) : null;
  const value = (key: string) => (certificate?.[key] ?? null) as string | number | null;

  return (
    <Panel>
      <AdminForm
        action={saveCertificate.bind(null, id)}
        footer={
          <>
            <Link href="/admin/certificates" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>
            {id && can.deleteContent(role) ? (
              <span className="ms-auto">
                <ConfirmAction action={deleteCertificate.bind(null, id)} confirm="این گواهی‌نامه حذف شود؟" variant="destructive">حذف</ConfirmAction>
              </span>
            ) : null}
          </>
        }
      >
        <p className="rounded-lg bg-ground-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
          فقط گواهی‌نامه‌ای را منتشر کنید که کارخانه واقعاً دارد. گواهی‌نامه‌ای که تاریخ اعتبارش گذشته باشد خودکار از سایت برداشته می‌شود.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField name="slug" label="نامک" defaultValue={value('slug')} dir="ltr" required hint="مثل iso-22000" />
          <TextField name="number" label="شماره‌ی گواهی" defaultValue={value('number')} dir="ltr" />
          <TextField name="position" label="ترتیب نمایش" defaultValue={value('position') ?? 0} dir="ltr" inputMode="numeric" />
          <TextField name="issued_at" label="تاریخ صدور (میلادی)" type="date" defaultValue={value('issued_at')} dir="ltr" />
          <TextField name="valid_until" label="معتبر تا (میلادی)" type="date" defaultValue={value('valid_until')} dir="ltr" />
        </div>
        <LocalizedField name="title" label="عنوان" values={t(certificate?.title)} required />
        <LocalizedField name="issuer" label="صادرکننده" values={t(certificate?.issuer)} required />
        <LocalizedField name="scope" label="دامنه‌ی گواهی" values={t(certificate?.scope)} multiline rows={2} />
        <FormSection title="فایل‌ها">
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField name="logo" label="نشان (تصویر)" accept="image/*" current={mediaInfo(certificate?.logo_media_id)} removeName="remove_logo" />
            <FileField name="document" label="متن گواهی (PDF)" accept="application/pdf" current={mediaInfo(certificate?.document_media_id)} removeName="remove_document" />
          </div>
        </FormSection>
        <CheckboxField
          name="is_published"
          label="منتشر در سایت"
          defaultChecked={Number(certificate?.is_published) === 1}
          disabled={!can.publish(role)}
          hint={can.publish(role) ? undefined : 'انتشار با ویراستار یا مدیر است.'}
        />
      </AdminForm>
    </Panel>
  );
}
