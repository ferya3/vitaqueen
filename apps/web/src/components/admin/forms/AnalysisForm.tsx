import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, FileField, FormSection, TextField } from '@/components/admin/fields';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { Panel } from '@/components/admin/ui';
import { deleteAnalysis, saveAnalysis } from '@/server/actions/quality';
import { mediaInfo } from '@/server/admin-data';
import { all, type Row } from '@/server/db';
import { MINERALS } from '@/lib/minerals';
import { can, type Role } from '@/lib/roles';

export function AnalysisForm({ analysis, role }: { analysis?: Row; role: Role }) {
  const id = analysis ? Number(analysis.id) : null;
  const value = (key: string) => (analysis?.[key] ?? null) as string | number | null;
  const minerals = new Map(
    (id ? all<Row>('SELECT * FROM water_analysis_values WHERE water_analysis_id = ?', [id]) : []).map((row) => [String(row.key), row]),
  );

  return (
    <Panel>
      <AdminForm
        action={saveAnalysis.bind(null, id)}
        footer={
          <>
            <Link href="/admin/analyses" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>
            {id && can.deleteContent(role) ? (
              <span className="ms-auto">
                <ConfirmAction action={deleteAnalysis.bind(null, id)} confirm="این آنالیز حذف شود؟" variant="destructive">حذف</ConfirmAction>
              </span>
            ) : null}
          </>
        }
      >
        <FormSection title="نمونه" description="سایت همیشه جدیدترین آنالیز منتشرشده را نشان می‌دهد.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField name="sampling_point" label="محل نمونه‌برداری" defaultValue={value('sampling_point') ?? 'Wellhead'} dir="ltr" required />
            <TextField name="sampled_at" label="تاریخ نمونه‌برداری (میلادی)" type="date" defaultValue={value('sampled_at')} dir="ltr" required />
            <TextField name="laboratory" label="آزمایشگاه" defaultValue={value('laboratory')} />
            <TextField name="report_number" label="شماره‌ی گزارش" defaultValue={value('report_number')} dir="ltr" />
            <TextField name="ph" label="pH" defaultValue={value('ph')} dir="ltr" inputMode="decimal" required />
            <TextField name="tds" label="TDS (mg/L)" defaultValue={value('tds')} dir="ltr" inputMode="numeric" required />
            <TextField name="hardness" label="سختی (mg/L CaCO₃)" defaultValue={value('hardness')} dir="ltr" inputMode="numeric" />
            <TextField name="temperature_c" label="دما (°C)" defaultValue={value('temperature_c')} dir="ltr" inputMode="decimal" />
          </div>
        </FormSection>

        <FormSection title="ترکیب مواد معدنی" description="مقدار خالی یعنی این ماده در گزارش نیست. واحد همه mg/L است.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-xs text-ink-500">
                  <th className="pb-2 text-start font-medium">ماده</th>
                  <th className="pb-2 text-start font-medium">مقدار</th>
                  <th className="pb-2 text-start font-medium">حد مجاز</th>
                  <th className="pb-2 text-start font-medium">روش آزمون</th>
                </tr>
              </thead>
              <tbody>
                {MINERALS.map((mineral) => {
                  const row = minerals.get(mineral.key);
                  return (
                    <tr key={mineral.key}>
                      <td className="py-1.5 pe-3 font-medium text-ink-700">{mineral.label}</td>
                      <td className="py-1.5 pe-3"><TextField name={`mineral.${mineral.key}.value`} label={`${mineral.label} — مقدار`} hideLabel defaultValue={(row?.value as number) ?? null} dir="ltr" inputMode="decimal" /></td>
                      <td className="py-1.5 pe-3"><TextField name={`mineral.${mineral.key}.limit`} label={`${mineral.label} — حد مجاز`} hideLabel defaultValue={(row?.limit_value as number) ?? null} dir="ltr" inputMode="decimal" /></td>
                      <td className="py-1.5"><TextField name={`mineral.${mineral.key}.method`} label={`${mineral.label} — روش آزمون`} hideLabel defaultValue={(row?.method as string) ?? null} dir="ltr" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FormSection>

        <FileField name="document" label="گزارش آزمایشگاه (PDF)" accept="application/pdf" current={mediaInfo(analysis?.document_media_id)} removeName="remove_document" />

        <div className="grid gap-3">
          <CheckboxField
            name="is_sample"
            label="این اعداد داده‌ی نمونه‌اند"
            defaultChecked={id ? Number(analysis?.is_sample) === 1 : false}
            hint="تا وقتی روشن است، سایت به بازدیدکننده می‌گوید این‌ها اعداد نمونه‌اند. با ثبت نتیجه‌ی واقعی خاموشش کنید."
          />
          <CheckboxField
            name="is_published"
            label="منتشر در سایت"
            defaultChecked={Number(analysis?.is_published) === 1}
            disabled={!can.publish(role)}
            hint={can.publish(role) ? undefined : 'انتشار با ویراستار یا مدیر است.'}
          />
        </div>
      </AdminForm>
    </Panel>
  );
}
