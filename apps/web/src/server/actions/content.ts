'use server';

import { redirect } from 'next/navigation';
import type { FormState } from '@/lib/form-state';
import { can } from '@/lib/roles';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { get, now, run, type Row } from '@/server/db';
import { DATE, SLUG, bool, integer, localized, optionalText, refreshSite, text } from '@/server/form';
import { isFile, storeDocument, storeImage, type StoredMedia } from '@/server/media';
import { toStored } from '@/server/translations';
import { changedFields, hasErrors, invalid, taken, uploadFailure } from './shared';

/** A content manager's save keeps whatever publish state the row already had. */
function publishState(role: Parameters<typeof can.publish>[0], data: FormData, existing: Row | undefined) {
  return can.publish(role) ? (bool(data, 'is_published') ? 1 : 0) : Number(existing?.is_published ?? 0);
}

// --- Certificates ---------------------------------------------------------------

export async function saveCertificate(id: number | null, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = id ? get<Row>('SELECT * FROM certificates WHERE id = ?', [id]) : undefined;
  if (id && !existing) return { error: 'این گواهی‌نامه دیگر وجود ندارد.' };

  const title = localized(data, 'title', 200);
  const issuer = localized(data, 'issuer', 200);
  const values = {
    slug: text(data, 'slug', 120).toLowerCase(),
    title: toStored(title),
    issuer: toStored(issuer),
    number: optionalText(data, 'number', 120),
    scope: toStored(localized(data, 'scope', 600)),
    issued_at: optionalText(data, 'issued_at', 10),
    valid_until: optionalText(data, 'valid_until', 10),
    is_published: publishState(user.role, data, existing),
    position: integer(data, 'position') ?? 0,
  };

  const errors: Record<string, string> = {};
  if (!SLUG.test(values.slug)) errors.slug = 'فقط حروف کوچک انگلیسی، عدد و خط تیره؛ مثل iso-22000.';
  else if (taken('certificates', 'slug', values.slug, id)) errors.slug = 'این نامک قبلاً استفاده شده است.';
  if (!title.fa) errors.title = 'عنوان فارسی لازم است.';
  if (!issuer.fa && !issuer.en) errors.issuer = 'صادرکننده را دست‌کم به فارسی یا انگلیسی وارد کنید.';
  if (values.issued_at && !DATE.test(values.issued_at)) errors.issued_at = 'تاریخ میلادی به شکل 2026-01-31.';
  if (values.valid_until && !DATE.test(values.valid_until)) errors.valid_until = 'تاریخ میلادی به شکل 2027-01-31.';
  if (Number.isNaN(values.position)) errors.position = 'عدد معتبر وارد کنید.';
  if (hasErrors(errors)) return invalid(errors);

  let logo: StoredMedia | null = null;
  let document: StoredMedia | null = null;
  try {
    const logoFile = data.get('logo');
    if (isFile(logoFile)) logo = await storeImage(logoFile, user, title.fa);
    const documentFile = data.get('document');
    if (isFile(documentFile)) document = await storeDocument(documentFile, user);
  } catch (error) {
    return uploadFailure(error, logo ? 'document' : 'logo');
  }

  const logoId = logo?.id ?? (bool(data, 'remove_logo') ? null : (existing?.logo_media_id ?? null));
  const documentId = document?.id ?? (bool(data, 'remove_document') ? null : (existing?.document_media_id ?? null));
  const timestamp = now();

  let certificateId = id;
  if (id) {
    run(
      `UPDATE certificates SET slug = ?, title = ?, issuer = ?, number = ?, scope = ?, issued_at = ?, valid_until = ?,
         is_published = ?, position = ?, logo_media_id = ?, document_media_id = ?, updated_at = ? WHERE id = ?`,
      [...Object.values(values), logoId, documentId, timestamp, id],
    );
  } else {
    certificateId = run(
      `INSERT INTO certificates (slug, title, issuer, number, scope, issued_at, valid_until, is_published, position,
         logo_media_id, document_media_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...Object.values(values), logoId, documentId, timestamp, timestamp],
    ).id;
  }

  await audit(id ? 'updated' : 'created', {
    user,
    resourceType: 'certificate',
    resourceId: certificateId,
    details: { slug: values.slug, fields: changedFields(existing, values) },
  });
  refreshSite();
  if (!id) redirect(`/admin/certificates/${certificateId}?created=1`);
  return { ok: true, message: 'ذخیره شد.' };
}

export async function deleteCertificate(id: number) {
  const user = await requireAdmin('editor');
  const existing = get<Row>('SELECT slug FROM certificates WHERE id = ?', [id]);
  if (existing) {
    run('DELETE FROM certificates WHERE id = ?', [id]);
    await audit('deleted', { user, resourceType: 'certificate', resourceId: id, details: { slug: existing.slug } });
    refreshSite();
  }
  redirect('/admin/certificates');
}

// --- News -------------------------------------------------------------------------

export async function saveArticle(id: number | null, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = id ? get<Row>('SELECT * FROM news_articles WHERE id = ?', [id]) : undefined;
  if (id && !existing) return { error: 'این خبر دیگر وجود ندارد.' };

  const title = localized(data, 'title', 240);
  const isPublished = publishState(user.role, data, existing);
  const publishedDate = optionalText(data, 'published_at', 10);
  const tags = text(data, 'tags', 400)
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

  const values = {
    slug: text(data, 'slug', 160).toLowerCase(),
    title: toStored(title),
    excerpt: toStored(localized(data, 'excerpt', 600)),
    body: toStored(localized(data, 'body', 60_000)),
    tags: tags.length ? JSON.stringify(tags) : null,
    // Publishing without a date means "now"; a future date schedules it.
    published_at: publishedDate
      ? `${publishedDate}T06:00:00.000Z`
      : isPublished
        ? String(existing?.published_at ?? now())
        : ((existing?.published_at as string | null) ?? null),
    is_published: isPublished,
  };

  const errors: Record<string, string> = {};
  if (!SLUG.test(values.slug)) errors.slug = 'فقط حروف کوچک انگلیسی، عدد و خط تیره؛ مثل new-bottling-line.';
  else if (taken('news_articles', 'slug', values.slug, id)) errors.slug = 'این نامک قبلاً استفاده شده است.';
  if (!title.fa) errors.title = 'عنوان فارسی لازم است.';
  if (publishedDate && !DATE.test(publishedDate)) errors.published_at = 'تاریخ میلادی به شکل 2026-10-01.';
  if (hasErrors(errors)) return invalid(errors);

  let cover: StoredMedia | null = null;
  try {
    const file = data.get('cover');
    if (isFile(file)) cover = await storeImage(file, user, title.fa);
  } catch (error) {
    return uploadFailure(error, 'cover');
  }
  const coverId = cover?.id ?? (bool(data, 'remove_cover') ? null : (existing?.cover_media_id ?? null));
  const timestamp = now();

  let articleId = id;
  if (id) {
    run(
      `UPDATE news_articles SET slug = ?, title = ?, excerpt = ?, body = ?, tags = ?, published_at = ?, is_published = ?,
         cover_media_id = ?, updated_at = ? WHERE id = ?`,
      [...Object.values(values), coverId, timestamp, id],
    );
  } else {
    articleId = run(
      `INSERT INTO news_articles (slug, title, excerpt, body, tags, published_at, is_published, cover_media_id, author_id,
         created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...Object.values(values), coverId, user.id, timestamp, timestamp],
    ).id;
  }

  await audit(id ? 'updated' : 'created', {
    user,
    resourceType: 'news',
    resourceId: articleId,
    details: { slug: values.slug, fields: changedFields(existing, values) },
  });
  refreshSite();
  if (!id) redirect(`/admin/news/${articleId}?created=1`);
  return { ok: true, message: 'ذخیره شد.' };
}

export async function deleteArticle(id: number) {
  const user = await requireAdmin('editor');
  const existing = get<Row>('SELECT slug FROM news_articles WHERE id = ?', [id]);
  if (existing) {
    run('DELETE FROM news_articles WHERE id = ?', [id]);
    await audit('deleted', { user, resourceType: 'news', resourceId: id, details: { slug: existing.slug } });
    refreshSite();
  }
  redirect('/admin/news');
}

// --- Legal pages ------------------------------------------------------------------

export async function savePage(id: number, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = get<Row>('SELECT * FROM pages WHERE id = ?', [id]);
  if (!existing) return { error: 'این صفحه وجود ندارد.' };

  const title = localized(data, 'title', 200);
  const body = localized(data, 'body', 100_000);
  const values = {
    title: toStored(title),
    body: toStored(body),
    meta_description: toStored(localized(data, 'meta_description', 300)),
    is_published: publishState(user.role, data, existing),
  };

  const errors: Record<string, string> = {};
  if (!title.fa) errors.title = 'عنوان فارسی لازم است.';
  if (values.is_published && !body.fa && !body.en) errors.body = 'صفحه‌ی بدون متن منتشر نمی‌شود.';
  if (hasErrors(errors)) return invalid(errors);

  run('UPDATE pages SET title = ?, body = ?, meta_description = ?, is_published = ?, updated_at = ? WHERE id = ?', [
    ...Object.values(values),
    now(),
    id,
  ]);
  await audit('updated', { user, resourceType: 'page', resourceId: id, details: { slug: existing.slug, fields: changedFields(existing, values) } });
  refreshSite();
  return { ok: true, message: 'ذخیره شد.' };
}

// --- Distributors -------------------------------------------------------------------

export async function saveDistributor(id: number | null, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = id ? get<Row>('SELECT * FROM distributors WHERE id = ?', [id]) : undefined;
  if (id && !existing) return { error: 'این نماینده دیگر وجود ندارد.' };

  const region = localized(data, 'region', 120);
  const values = {
    company: text(data, 'company', 180),
    region: toStored(region),
    country: text(data, 'country', 2).toUpperCase(),
    city: optionalText(data, 'city', 120),
    phone: optionalText(data, 'phone', 40),
    email: optionalText(data, 'email', 180)?.toLowerCase() ?? null,
    website: optionalText(data, 'website', 255),
    is_published: publishState(user.role, data, existing),
    position: integer(data, 'position') ?? 0,
  };

  const errors: Record<string, string> = {};
  if (!values.company) errors.company = 'نام شرکت لازم است.';
  if (!region.fa && !region.en) errors.region = 'منطقه را دست‌کم به فارسی یا انگلیسی وارد کنید.';
  if (!/^[A-Z]{2}$/.test(values.country)) errors.country = 'کد دوحرفی کشور، مثل IR یا AE.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'ایمیل معتبر نیست.';
  if (values.website && !/^https?:\/\/[^\s]+$/i.test(values.website)) errors.website = 'نشانی باید با https:// شروع شود.';
  if (Number.isNaN(values.position)) errors.position = 'عدد معتبر وارد کنید.';
  if (hasErrors(errors)) return invalid(errors);

  const timestamp = now();
  let distributorId = id;
  if (id) {
    run(
      `UPDATE distributors SET company = ?, region = ?, country = ?, city = ?, phone = ?, email = ?, website = ?,
         is_published = ?, position = ?, updated_at = ? WHERE id = ?`,
      [...Object.values(values), timestamp, id],
    );
  } else {
    distributorId = run(
      `INSERT INTO distributors (company, region, country, city, phone, email, website, is_published, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...Object.values(values), timestamp, timestamp],
    ).id;
  }

  await audit(id ? 'updated' : 'created', {
    user,
    resourceType: 'distributor',
    resourceId: distributorId,
    details: { company: values.company, fields: changedFields(existing, values) },
  });
  refreshSite();
  if (!id) redirect('/admin/distributors?created=1');
  return { ok: true, message: 'ذخیره شد.' };
}

export async function deleteDistributor(id: number) {
  const user = await requireAdmin('editor');
  const existing = get<Row>('SELECT company FROM distributors WHERE id = ?', [id]);
  if (existing) {
    run('DELETE FROM distributors WHERE id = ?', [id]);
    await audit('deleted', { user, resourceType: 'distributor', resourceId: id, details: { company: existing.company } });
    refreshSite();
  }
  redirect('/admin/distributors');
}
