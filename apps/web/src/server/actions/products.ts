'use server';

import { redirect } from 'next/navigation';
import type { FormState } from '@/lib/form-state';
import { can } from '@/lib/roles';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { get, now, run, tx, type Row } from '@/server/db';
import { SLUG, bool, integer, localized, number, optionalText, refreshSite, text } from '@/server/form';
import { isFile, storeDocument, storeImage, type StoredMedia } from '@/server/media';
import { toStored } from '@/server/translations';
import { changedFields, hasErrors, invalid, taken, uploadFailure } from './shared';

export async function saveProduct(id: number | null, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = id ? get<Row>('SELECT * FROM products WHERE id = ?', [id]) : undefined;
  if (id && !existing) return { error: 'این محصول دیگر وجود ندارد.' };

  const name = localized(data, 'name', 200);
  const values = {
    slug: text(data, 'slug', 120).toLowerCase(),
    sku: text(data, 'sku', 64),
    name: toStored(name),
    tagline: toStored(localized(data, 'tagline', 200)),
    description: toStored(localized(data, 'description', 4000)),
    packaging: toStored(localized(data, 'packaging', 300)),
    volume_ml: integer(data, 'volume_ml'),
    bottle_type: optionalText(data, 'bottle_type', 120),
    cap_type: optionalText(data, 'cap_type', 120),
    ph: number(data, 'ph'),
    tds: integer(data, 'tds'),
    shelf_life_months: integer(data, 'shelf_life_months'),
    units_per_case: integer(data, 'units_per_case'),
    cases_per_pallet: integer(data, 'cases_per_pallet'),
    barcode: optionalText(data, 'barcode', 32),
    model_3d_url: optionalText(data, 'model_3d_url', 500),
    featured: bool(data, 'featured') ? 1 : 0,
    // Publishing is an editor's decision; a content manager's save keeps
    // whatever state the product was already in.
    is_published: can.publish(user.role) ? (bool(data, 'is_published') ? 1 : 0) : Number(existing?.is_published ?? 0),
    position: integer(data, 'position') ?? 0,
  };

  const errors: Record<string, string> = {};
  if (!SLUG.test(values.slug)) errors.slug = 'فقط حروف کوچک انگلیسی، عدد و خط تیره؛ مثل 500ml.';
  else if (taken('products', 'slug', values.slug, id)) errors.slug = 'این نامک قبلاً استفاده شده است.';
  if (!values.sku) errors.sku = 'کد کالا لازم است.';
  else if (taken('products', 'sku', values.sku, id)) errors.sku = 'این کد کالا قبلاً استفاده شده است.';
  if (!name.fa) errors.name = 'نام فارسی لازم است.';
  if (!values.volume_ml || values.volume_ml < 1 || Number.isNaN(values.volume_ml)) errors.volume_ml = 'حجم را به میلی‌لیتر وارد کنید.';
  if (values.ph !== null && (Number.isNaN(values.ph) || values.ph < 0 || values.ph > 14)) errors.ph = 'pH باید بین ۰ تا ۱۴ باشد.';
  for (const key of ['tds', 'shelf_life_months', 'units_per_case', 'cases_per_pallet', 'position'] as const) {
    const value = values[key];
    if (value !== null && (Number.isNaN(value) || value < 0)) errors[key] = 'عدد معتبر وارد کنید.';
  }
  if (values.model_3d_url && !/^(https:\/\/|\/)/.test(values.model_3d_url)) errors.model_3d_url = 'نشانی باید با https:// یا / شروع شود.';
  if (hasErrors(errors)) return invalid(errors);

  // Uploads after validation, so a typo elsewhere does not leave orphan files.
  const images: StoredMedia[] = [];
  let datasheet: StoredMedia | null = null;
  try {
    for (const file of data.getAll('images')) {
      if (isFile(file)) images.push(await storeImage(file, user, name.fa));
    }
    const sheet = data.get('datasheet');
    if (isFile(sheet)) datasheet = await storeDocument(sheet, user);
  } catch (error) {
    return uploadFailure(error, images.length ? 'datasheet' : 'images');
  }

  const certificateIds = data
    .getAll('certificates')
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  const removeImages = data.getAll('remove_image').map(Number);
  const timestamp = now();

  const productId = tx(() => {
    let productId = id;
    const datasheetId = datasheet?.id ?? (bool(data, 'remove_datasheet') ? null : (existing?.datasheet_media_id ?? null));

    if (productId) {
      run(
        `UPDATE products SET slug = ?, sku = ?, name = ?, tagline = ?, description = ?, packaging = ?, volume_ml = ?,
           bottle_type = ?, cap_type = ?, ph = ?, tds = ?, shelf_life_months = ?, units_per_case = ?, cases_per_pallet = ?,
           barcode = ?, model_3d_url = ?, featured = ?, is_published = ?, position = ?, datasheet_media_id = ?, updated_at = ?
         WHERE id = ?`,
        [...Object.values(values), datasheetId, timestamp, productId],
      );
    } else {
      productId = run(
        `INSERT INTO products (slug, sku, name, tagline, description, packaging, volume_ml, bottle_type, cap_type, ph, tds,
           shelf_life_months, units_per_case, cases_per_pallet, barcode, model_3d_url, featured, is_published, position,
           datasheet_media_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...Object.values(values), datasheetId, timestamp, timestamp],
      ).id;
    }

    for (const mediaId of removeImages) run('DELETE FROM product_media WHERE product_id = ? AND media_id = ?', [productId, mediaId]);
    const next = Number(get<{ n: number }>('SELECT coalesce(max(position), -1) + 1 AS n FROM product_media WHERE product_id = ?', [productId])?.n ?? 0);
    images.forEach((image, index) =>
      run('INSERT INTO product_media (product_id, media_id, position) VALUES (?, ?, ?)', [productId, image.id, next + index]),
    );

    run('DELETE FROM certificate_product WHERE product_id = ?', [productId]);
    for (const certificateId of certificateIds) {
      run('INSERT OR IGNORE INTO certificate_product (product_id, certificate_id) SELECT ?, id FROM certificates WHERE id = ?', [productId, certificateId]);
    }
    return productId;
  });

  await audit(id ? 'updated' : 'created', {
    user,
    resourceType: 'product',
    resourceId: productId,
    details: { slug: values.slug, fields: changedFields(existing, values), images_added: images.length },
  });
  refreshSite();

  if (!id) redirect(`/admin/products/${productId}?created=1`);
  return { ok: true, message: 'ذخیره شد.' };
}

export async function deleteProduct(id: number) {
  const user = await requireAdmin('editor');
  const existing = get<Row>('SELECT slug FROM products WHERE id = ?', [id]);
  if (existing) {
    run('DELETE FROM products WHERE id = ?', [id]);
    await audit('deleted', { user, resourceType: 'product', resourceId: id, details: { slug: existing.slug } });
    refreshSite();
  }
  redirect('/admin/products');
}
