import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, FileField, FormSection, LocalizedField, TextField } from '@/components/admin/fields';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { Panel } from '@/components/admin/ui';
import { deleteProduct, saveProduct } from '@/server/actions/products';
import { all, type Row } from '@/server/db';
import { fa, mediaInfo, t } from '@/server/admin-data';
import { mediaUrl } from '@/server/media-url';
import { can, type Role } from '@/lib/roles';

export function ProductForm({ product, role }: { product?: Row; role: Role }) {
  const id = product ? Number(product.id) : null;
  const certificates = all<Row>('SELECT id, title FROM certificates ORDER BY position, id');
  const linked = new Set(
    id ? all<{ certificate_id: number }>('SELECT certificate_id FROM certificate_product WHERE product_id = ?', [id]).map((row) => Number(row.certificate_id)) : [],
  );
  const images = id
    ? all<Row>('SELECT m.id, m.path FROM product_media pm JOIN media m ON m.id = pm.media_id WHERE pm.product_id = ? ORDER BY pm.position', [id])
    : [];
  const value = (key: string) => (product?.[key] ?? null) as string | number | null;

  return (
    <Panel>
      <AdminForm
        action={saveProduct.bind(null, id)}
        footer={
          <>
            <Link href="/admin/products" className="text-sm text-ink-500 hover:text-heading">
              بازگشت
            </Link>
            {id && can.deleteContent(role) ? (
              <span className="ms-auto">
                <ConfirmAction action={deleteProduct.bind(null, id)} confirm="این محصول برای همیشه حذف شود؟" variant="destructive">
                  حذف محصول
                </ConfirmAction>
              </span>
            ) : null}
          </>
        }
      >
        <FormSection title="شناسه">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="slug" label="نامک (در نشانی صفحه)" defaultValue={value('slug')} dir="ltr" required hint="مثل 500ml" />
            <TextField name="sku" label="کد کالا (SKU)" defaultValue={value('sku')} dir="ltr" required />
            <TextField name="barcode" label="بارکد" defaultValue={value('barcode')} dir="ltr" inputMode="numeric" />
          </div>
        </FormSection>

        <FormSection title="متن‌ها" description="فارسی لازم است؛ زبان‌های خالی در سایت به انگلیسی و سپس فارسی برمی‌گردند.">
          <LocalizedField name="name" label="نام محصول" values={t(product?.name)} required />
          <LocalizedField name="tagline" label="شعار کوتاه" values={t(product?.tagline)} />
          <LocalizedField name="description" label="توضیحات" values={t(product?.description)} multiline rows={3} />
          <LocalizedField name="packaging" label="بسته‌بندی" values={t(product?.packaging)} hint="مثل: شرینک ۱۲ عددی" />
        </FormSection>

        <FormSection title="مشخصات فنی">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField name="volume_ml" label="حجم (میلی‌لیتر)" defaultValue={value('volume_ml')} dir="ltr" inputMode="numeric" required />
            <TextField name="bottle_type" label="نوع بطری" defaultValue={value('bottle_type')} dir="ltr" />
            <TextField name="cap_type" label="نوع درب" defaultValue={value('cap_type')} dir="ltr" />
            <TextField name="ph" label="pH" defaultValue={value('ph')} dir="ltr" inputMode="decimal" />
            <TextField name="tds" label="TDS (mg/L)" defaultValue={value('tds')} dir="ltr" inputMode="numeric" />
            <TextField name="shelf_life_months" label="ماندگاری (ماه)" defaultValue={value('shelf_life_months')} dir="ltr" inputMode="numeric" />
            <TextField name="units_per_case" label="تعداد در هر کارتن" defaultValue={value('units_per_case')} dir="ltr" inputMode="numeric" />
            <TextField name="cases_per_pallet" label="کارتن در هر پالت" defaultValue={value('cases_per_pallet')} dir="ltr" inputMode="numeric" />
            <TextField name="position" label="ترتیب نمایش" defaultValue={value('position') ?? 0} dir="ltr" inputMode="numeric" />
          </div>
          <TextField name="model_3d_url" label="نشانی مدل سه‌بعدی (glTF، اختیاری)" defaultValue={value('model_3d_url')} dir="ltr" />
        </FormSection>

        <FormSection title="تصاویر و فایل‌ها" description="تصاویر هنگام بارگذاری به WebP تبدیل و اطلاعات EXIF آن‌ها حذف می‌شود.">
          {images.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {images.map((image) => (
                <label key={String(image.id)} className="grid w-28 gap-1.5 text-xs text-ink-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(String(image.path))} alt="" className="aspect-square w-full rounded-lg border border-hairline bg-white object-contain" />
                  <span className="flex items-center gap-1.5">
                    <input type="checkbox" name="remove_image" value={String(image.id)} className="accent-red-600" />
                    حذف
                  </span>
                </label>
              ))}
            </div>
          ) : null}
          <FileField name="images" label="افزودن تصویر" accept="image/*" multiple hint="JPEG، PNG، WebP، AVIF یا HEIC؛ حداکثر ۱۲ مگابایت" />
          <FileField
            name="datasheet"
            label="برگه‌ی مشخصات (PDF)"
            accept="application/pdf"
            current={mediaInfo(product?.datasheet_media_id)}
            removeName="remove_datasheet"
          />
        </FormSection>

        {certificates.length > 0 ? (
          <FormSection title="گواهی‌نامه‌های این محصول">
            <div className="grid gap-2 sm:grid-cols-2">
              {certificates.map((certificate) => (
                <CheckboxField
                  key={String(certificate.id)}
                  name="certificates"
                  label={fa(certificate.title)}
                  defaultChecked={linked.has(Number(certificate.id))}
                  value={String(certificate.id)}
                />
              ))}
            </div>
          </FormSection>
        ) : null}

        <FormSection title="انتشار">
          <div className="grid gap-3">
            <CheckboxField name="featured" label="محصول ویژه (در صفحه‌ی اصلی)" defaultChecked={Number(product?.featured) === 1} />
            <CheckboxField
              name="is_published"
              label="منتشر در سایت"
              defaultChecked={Number(product?.is_published) === 1}
              disabled={!can.publish(role)}
              hint={can.publish(role) ? undefined : 'انتشار با ویراستار یا مدیر است.'}
            />
          </div>
        </FormSection>
      </AdminForm>
    </Panel>
  );
}
