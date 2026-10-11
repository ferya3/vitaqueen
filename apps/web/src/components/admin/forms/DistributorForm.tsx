import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, LocalizedField, TextField } from '@/components/admin/fields';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { Panel } from '@/components/admin/ui';
import { deleteDistributor, saveDistributor } from '@/server/actions/content';
import { t } from '@/server/admin-data';
import type { Row } from '@/server/db';
import { can, type Role } from '@/lib/roles';

export function DistributorForm({ distributor, role }: { distributor?: Row; role: Role }) {
  const id = distributor ? Number(distributor.id) : null;
  const value = (key: string) => (distributor?.[key] ?? null) as string | number | null;

  return (
    <Panel>
      <AdminForm
        action={saveDistributor.bind(null, id)}
        footer={
          <>
            <Link href="/admin/distributors" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>
            {id && can.deleteContent(role) ? (
              <span className="ms-auto">
                <ConfirmAction action={deleteDistributor.bind(null, id)} confirm="این نماینده حذف شود؟" variant="destructive">حذف</ConfirmAction>
              </span>
            ) : null}
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="company" label="نام شرکت" defaultValue={value('company')} required />
          <TextField name="country" label="کد کشور" defaultValue={value('country')} dir="ltr" required hint="دوحرفی، مثل IR، AE، RU" />
          <TextField name="city" label="شهر" defaultValue={value('city')} />
          <TextField name="phone" label="تلفن" defaultValue={value('phone')} dir="ltr" inputMode="tel" />
          <TextField name="email" label="ایمیل" defaultValue={value('email')} dir="ltr" inputMode="email" />
          <TextField name="website" label="وب‌سایت" defaultValue={value('website')} dir="ltr" inputMode="url" />
          <TextField name="position" label="ترتیب نمایش" defaultValue={value('position') ?? 0} dir="ltr" inputMode="numeric" />
        </div>
        <LocalizedField name="region" label="منطقه" values={t(distributor?.region)} required />
        <CheckboxField
          name="is_published"
          label="منتشر در سایت"
          defaultChecked={Number(distributor?.is_published) === 1}
          disabled={!can.publish(role)}
          hint={can.publish(role) ? undefined : 'انتشار با ویراستار یا مدیر است.'}
        />
      </AdminForm>
    </Panel>
  );
}
