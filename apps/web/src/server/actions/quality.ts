'use server';

import { redirect } from 'next/navigation';
import type { FormState } from '@/lib/form-state';
import { can } from '@/lib/roles';
import { MINERALS } from '@/lib/minerals';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { get, now, run, tx, type Row } from '@/server/db';
import { DATE, bool, integer, localized, number, optionalText, refreshSite, text } from '@/server/form';
import { isFile, storeDocument, storeImage, type StoredMedia } from '@/server/media';
import { toStored } from '@/server/translations';
import { changedFields, hasErrors, invalid, uploadFailure } from './shared';

const bad = (value: number | null, min = 0, max = Infinity) => value !== null && (Number.isNaN(value) || value < min || value > max);

// --- Water analyses -------------------------------------------------------------

export async function saveAnalysis(id: number | null, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = id ? get<Row>('SELECT * FROM water_analyses WHERE id = ?', [id]) : undefined;
  if (id && !existing) return { error: 'این آنالیز دیگر وجود ندارد.' };

  const values = {
    sampling_point: text(data, 'sampling_point', 120),
    sampled_at: text(data, 'sampled_at', 10),
    laboratory: optionalText(data, 'laboratory', 180),
    report_number: optionalText(data, 'report_number', 120),
    ph: number(data, 'ph'),
    tds: integer(data, 'tds'),
    hardness: integer(data, 'hardness'),
    temperature_c: number(data, 'temperature_c'),
    // Saving real figures is what clears the "sample data" notice on the site.
    is_sample: bool(data, 'is_sample') ? 1 : 0,
    is_published: can.publish(user.role) ? (bool(data, 'is_published') ? 1 : 0) : Number(existing?.is_published ?? 0),
  };

  const errors: Record<string, string> = {};
  if (!values.sampling_point) errors.sampling_point = 'محل نمونه‌برداری لازم است.';
  if (!DATE.test(values.sampled_at)) errors.sampled_at = 'تاریخ میلادی به شکل 2026-10-01.';
  if (values.ph === null || bad(values.ph, 0, 14)) errors.ph = 'pH بین ۰ تا ۱۴ لازم است.';
  if (values.tds === null || bad(values.tds)) errors.tds = 'TDS لازم است.';
  if (bad(values.hardness)) errors.hardness = 'عدد معتبر وارد کنید.';
  if (bad(values.temperature_c, -5, 100)) errors.temperature_c = 'عدد معتبر وارد کنید.';

  const minerals = MINERALS.map((mineral, position) => ({
    key: mineral.key,
    value: number(data, `mineral.${mineral.key}.value`),
    limit: number(data, `mineral.${mineral.key}.limit`),
    method: optionalText(data, `mineral.${mineral.key}.method`, 120),
    unit: mineral.unit,
    position,
  }));
  for (const mineral of minerals) {
    if (bad(mineral.value) || bad(mineral.limit)) errors[`mineral.${mineral.key}.value`] = 'عدد معتبر وارد کنید.';
  }
  if (hasErrors(errors)) return invalid(errors);

  let document: StoredMedia | null = null;
  try {
    const file = data.get('document');
    if (isFile(file)) document = await storeDocument(file, user);
  } catch (error) {
    return uploadFailure(error, 'document');
  }
  const documentId = document?.id ?? (bool(data, 'remove_document') ? null : (existing?.document_media_id ?? null));
  const timestamp = now();

  const analysisId = tx(() => {
    let analysisId = id;
    if (id) {
      run(
        `UPDATE water_analyses SET sampling_point = ?, sampled_at = ?, laboratory = ?, report_number = ?, ph = ?, tds = ?,
           hardness = ?, temperature_c = ?, is_sample = ?, is_published = ?, document_media_id = ?, updated_at = ? WHERE id = ?`,
        [...Object.values(values), documentId, timestamp, id],
      );
    } else {
      analysisId = run(
        `INSERT INTO water_analyses (sampling_point, sampled_at, laboratory, report_number, ph, tds, hardness, temperature_c,
           is_sample, is_published, document_media_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...Object.values(values), documentId, timestamp, timestamp],
      ).id;
    }

    run('DELETE FROM water_analysis_values WHERE water_analysis_id = ?', [analysisId]);
    for (const mineral of minerals) {
      if (mineral.value === null) continue;
      run(
        `INSERT INTO water_analysis_values (water_analysis_id, key, value, unit, limit_value, method, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [analysisId, mineral.key, mineral.value, mineral.unit, mineral.limit, mineral.method, mineral.position],
      );
    }
    return analysisId;
  });

  await audit(id ? 'updated' : 'created', {
    user,
    resourceType: 'water_analysis',
    resourceId: analysisId,
    details: { sampled_at: values.sampled_at, fields: changedFields(existing, values) },
  });
  refreshSite();
  if (!id) redirect(`/admin/analyses/${analysisId}?created=1`);
  return { ok: true, message: 'ذخیره شد.' };
}

export async function deleteAnalysis(id: number) {
  const user = await requireAdmin('editor');
  const existing = get<Row>('SELECT sampled_at FROM water_analyses WHERE id = ?', [id]);
  if (existing) {
    run('DELETE FROM water_analyses WHERE id = ?', [id]);
    await audit('deleted', { user, resourceType: 'water_analysis', resourceId: id, details: { sampled_at: existing.sampled_at } });
    refreshSite();
  }
  redirect('/admin/analyses');
}

// --- Source profile ---------------------------------------------------------------

export async function saveSource(_state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = get<Row>('SELECT * FROM source_profile WHERE id = 1');

  const sourceType = localized(data, 'source_type', 160);
  const aquiferAge = localized(data, 'aquifer_age', 160);
  const values = {
    altitude_meters: integer(data, 'altitude_meters'),
    latitude: number(data, 'latitude'),
    longitude: number(data, 'longitude'),
    source_type: toStored(sourceType),
    aquifer_age: toStored(aquiferAge),
    temperature_c: number(data, 'temperature_c'),
    ph: number(data, 'ph'),
    tds: integer(data, 'tds'),
    hardness: integer(data, 'hardness'),
    is_sample: bool(data, 'is_sample') ? 1 : 0,
  };

  const errors: Record<string, string> = {};
  if (values.altitude_meters === null || bad(values.altitude_meters, -500, 9000)) errors.altitude_meters = 'ارتفاع به متر لازم است.';
  if (values.latitude === null || bad(values.latitude, -90, 90)) errors.latitude = 'عرض جغرافیایی بین ۹۰- تا ۹۰.';
  if (values.longitude === null || bad(values.longitude, -180, 180)) errors.longitude = 'طول جغرافیایی بین ۱۸۰- تا ۱۸۰.';
  if (!sourceType.fa) errors.source_type = 'نوع منبع به فارسی لازم است.';
  if (!aquiferAge.fa) errors.aquifer_age = 'عمر آبخوان به فارسی لازم است.';
  if (values.temperature_c === null || bad(values.temperature_c, -5, 100)) errors.temperature_c = 'دما لازم است.';
  if (values.ph === null || bad(values.ph, 0, 14)) errors.ph = 'pH بین ۰ تا ۱۴ لازم است.';
  if (values.tds === null || bad(values.tds)) errors.tds = 'TDS لازم است.';
  if (values.hardness === null || bad(values.hardness)) errors.hardness = 'سختی لازم است.';
  if (hasErrors(errors)) return invalid(errors);

  run(
    `INSERT INTO source_profile (id, altitude_meters, latitude, longitude, source_type, aquifer_age, temperature_c, ph, tds,
       hardness, is_sample, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET altitude_meters = excluded.altitude_meters, latitude = excluded.latitude,
       longitude = excluded.longitude, source_type = excluded.source_type, aquifer_age = excluded.aquifer_age,
       temperature_c = excluded.temperature_c, ph = excluded.ph, tds = excluded.tds, hardness = excluded.hardness,
       is_sample = excluded.is_sample, updated_at = excluded.updated_at`,
    [...Object.values(values), now()],
  );
  await audit('updated', { user, resourceType: 'source_profile', resourceId: 1, details: { fields: changedFields(existing, values) } });
  refreshSite();
  return { ok: true, message: 'ذخیره شد.' };
}

// --- Production stages -------------------------------------------------------------

export async function saveStage(id: number, _state: FormState, data: FormData): Promise<FormState> {
  const user = await requireAdmin('content_manager');
  const existing = get<Row>('SELECT * FROM production_stages WHERE id = ?', [id]);
  if (!existing) return { error: 'این مرحله وجود ندارد.' };

  const values = {
    title: toStored(localized(data, 'title', 160)),
    body: toStored(localized(data, 'body', 2000)),
    video_webm_url: optionalText(data, 'video_webm_url', 500),
    video_mp4_url: optionalText(data, 'video_mp4_url', 500),
    is_published: can.publish(user.role) ? (bool(data, 'is_published') ? 1 : 0) : Number(existing.is_published),
    position: integer(data, 'position') ?? 0,
  };

  const errors: Record<string, string> = {};
  for (const key of ['video_webm_url', 'video_mp4_url'] as const) {
    const url = values[key];
    if (url && !/^(https:\/\/|\/)[^\s]+$/.test(url)) errors[key] = 'نشانی باید با https:// یا / شروع شود.';
  }
  if (Number.isNaN(values.position)) errors.position = 'عدد معتبر وارد کنید.';
  if (hasErrors(errors)) return invalid(errors);

  let image: StoredMedia | null = null;
  try {
    const file = data.get('image');
    if (isFile(file)) image = await storeImage(file, user);
  } catch (error) {
    return uploadFailure(error, 'image');
  }
  const mediaId = image?.id ?? (bool(data, 'remove_image') ? null : (existing.media_id ?? null));

  run(
    `UPDATE production_stages SET title = ?, body = ?, video_webm_url = ?, video_mp4_url = ?, is_published = ?, position = ?,
       media_id = ?, updated_at = ? WHERE id = ?`,
    [...Object.values(values), mediaId, now(), id],
  );
  await audit('updated', { user, resourceType: 'production_stage', resourceId: id, details: { key: existing.key, fields: changedFields(existing, values) } });
  refreshSite();
  return { ok: true, message: 'ذخیره شد.' };
}
