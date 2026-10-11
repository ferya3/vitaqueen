import type { Metadata } from 'next';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, LocalizedField, TextField } from '@/components/admin/fields';
import { PageHeader, Panel } from '@/components/admin/ui';
import { saveSource } from '@/server/actions/quality';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { t } from '@/server/admin-data';

export const metadata: Metadata = { title: 'مشخصات چشمه' };

export default async function SourcePage() {
  await requireAdmin();
  const row = get<Row>('SELECT * FROM source_profile WHERE id = 1');
  const value = (key: string) => (row?.[key] ?? null) as string | number | null;

  return (
    <>
      <PageHeader title="مشخصات چشمه" description="ترکیب مواد معدنی صفحه‌ی چشمه از جدیدترین آنالیز منتشرشده خوانده می‌شود، نه از اینجا." />
      <Panel>
        <AdminForm action={saveSource}>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="altitude_meters" label="ارتفاع (متر)" defaultValue={value('altitude_meters')} dir="ltr" inputMode="numeric" required />
            <TextField name="latitude" label="عرض جغرافیایی" defaultValue={value('latitude')} dir="ltr" inputMode="decimal" required />
            <TextField name="longitude" label="طول جغرافیایی" defaultValue={value('longitude')} dir="ltr" inputMode="decimal" required />
            <TextField name="temperature_c" label="دمای آب (°C)" defaultValue={value('temperature_c')} dir="ltr" inputMode="decimal" required />
            <TextField name="ph" label="pH" defaultValue={value('ph')} dir="ltr" inputMode="decimal" required />
            <TextField name="tds" label="TDS (mg/L)" defaultValue={value('tds')} dir="ltr" inputMode="numeric" required />
            <TextField name="hardness" label="سختی (mg/L)" defaultValue={value('hardness')} dir="ltr" inputMode="numeric" required />
          </div>
          <LocalizedField name="source_type" label="نوع منبع" values={t(row?.source_type)} required />
          <LocalizedField name="aquifer_age" label="عمر آبخوان" values={t(row?.aquifer_age)} required />
          <CheckboxField
            name="is_sample"
            label="این اعداد داده‌ی نمونه‌اند"
            defaultChecked={Number(row?.is_sample ?? 1) === 1}
            hint="تا وقتی روشن است، صفحه‌ی چشمه به بازدیدکننده می‌گوید این‌ها اعداد نمونه‌اند."
          />
        </AdminForm>
      </Panel>
    </>
  );
}
