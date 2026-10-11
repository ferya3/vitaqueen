import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp, { type OutputInfo } from 'sharp';
import { dataDir } from '../../db/core.mjs';
import { get, now, run } from './db';
import { audit } from './audit';
import type { AdminUser } from './auth';

/**
 * Uploads, with the checks that people usually skip.
 *
 * The threat is not "someone uploads an ugly picture", it is "someone uploads
 * a script with an image's name". So:
 *
 *  - the browser's filename and declared type are never trusted; the bytes are;
 *  - every image is *decoded and re-encoded* by sharp into WebP. Whatever the
 *    upload contained beyond pixels — EXIF location data, a polyglot payload,
 *    an embedded script — does not survive, and the stored file is a WebP
 *    sharp wrote itself;
 *  - PDFs must start with `%PDF-`, and are served with a sandboxing CSP;
 *  - stored names are random, so nothing user-supplied reaches the filesystem;
 *  - SVG is refused: it is a document that can run script.
 */
export const MEDIA_ROOT = () => join(dataDir(), 'uploads');

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
/** Longest edge after resizing. Big enough for a 2× hero on a wide screen. */
const MAX_EDGE = 2560;

export class UploadError extends Error {}

export type StoredMedia = { id: number; path: string; width: number | null; height: number | null };

function storedPath(extension: string) {
  const date = new Date();
  const folder = `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${folder}/${randomBytes(12).toString('hex')}.${extension}`;
}

async function persist(relative: string, bytes: Buffer) {
  const absolute = join(MEDIA_ROOT(), relative);
  await mkdir(dirname(absolute), { recursive: true, mode: 0o750 });
  await writeFile(absolute, bytes, { mode: 0o640 });
}

function originalName(file: File) {
  return (file.name || 'upload').replace(/[\u0000-\u001f]/g, '').slice(0, 200);
}

export function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === 'object' && value !== null && 'arrayBuffer' in value && value.size > 0;
}

export async function storeImage(file: File, user: AdminUser, alt?: string | null): Promise<StoredMedia> {
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError('حجم تصویر بیشتر از ۱۲ مگابایت است.');

  const input = Buffer.from(await file.arrayBuffer());

  let output: { data: Buffer; info: OutputInfo };
  try {
    const image = sharp(input, {
      // A decompression bomb is a few kilobytes that expand to gigapixels.
      limitInputPixels: 50_000_000,
      failOn: 'error',
    });
    const metadata = await image.metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp', 'avif', 'heif', 'gif', 'tiff'].includes(metadata.format)) {
      throw new UploadError('فقط تصویرهای JPEG، PNG، WebP، AVIF، HEIC، GIF یا TIFF پذیرفته می‌شوند.');
    }

    output = await image
      .rotate() // apply the EXIF orientation before the metadata is dropped
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError('این فایل یک تصویر معتبر نیست.');
  }

  const path = storedPath('webp');
  await persist(path, output.data);

  const { id } = run(
    `INSERT INTO media (kind, path, original_name, mime_type, size_bytes, width, height, checksum, alt, uploaded_by, created_at)
     VALUES ('image', ?, ?, 'image/webp', ?, ?, ?, ?, ?, ?, ?)`,
    [
      path,
      originalName(file),
      output.data.length,
      output.info.width,
      output.info.height,
      createHash('sha256').update(output.data).digest('hex'),
      alt ? JSON.stringify({ fa: alt }) : null,
      user.id,
      now(),
    ],
  );

  await audit('media_uploaded', { user, resourceType: 'media', resourceId: id, details: { path, bytes: output.data.length } });
  return { id, path, width: output.info.width, height: output.info.height };
}

export async function storeDocument(file: File, user: AdminUser): Promise<StoredMedia> {
  if (file.size > MAX_DOCUMENT_BYTES) throw new UploadError('حجم فایل PDF بیشتر از ۲۰ مگابایت است.');

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new UploadError('فقط فایل PDF پذیرفته می‌شود.');
  }

  const path = storedPath('pdf');
  await persist(path, bytes);

  const { id } = run(
    `INSERT INTO media (kind, path, original_name, mime_type, size_bytes, checksum, uploaded_by, created_at)
     VALUES ('document', ?, ?, 'application/pdf', ?, ?, ?, ?)`,
    [path, originalName(file), bytes.length, createHash('sha256').update(bytes).digest('hex'), user.id, now()],
  );

  await audit('media_uploaded', { user, resourceType: 'media', resourceId: id, details: { path, bytes: bytes.length } });
  return { id, path, width: null, height: null };
}

/** Deletes the row (references fall back to NULL) and then the file. */
export async function deleteMedia(id: number, user: AdminUser) {
  const row = get<{ path: string }>('SELECT path FROM media WHERE id = ?', [id]);
  if (!row) return;
  run('DELETE FROM media WHERE id = ?', [id]);
  await rm(join(MEDIA_ROOT(), row.path), { force: true });
  await audit('media_deleted', { user, resourceType: 'media', resourceId: id, details: { path: row.path } });
}

/** Strict shape of a stored path; anything else is refused before touching disk. */
export const STORED_PATH = /^\d{4}\/\d{2}\/[a-f0-9]{24}\.(webp|pdf)$/;
