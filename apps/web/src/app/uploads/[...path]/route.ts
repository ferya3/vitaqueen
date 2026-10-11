import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MEDIA_ROOT, STORED_PATH } from '@/server/media';

export const runtime = 'nodejs';

/**
 * Serves files uploaded through the admin panel.
 *
 * Uploads live under DATA_DIR, outside the build, because `next start` only
 * serves `public/` files that existed at build time. In production nginx can
 * serve the same directory directly (see `infra/nginx/vitaqueen.conf`); this
 * route is what makes a fresh install work without that.
 *
 * Only paths in the exact shape the uploader writes are accepted, so there is
 * no traversal to defend against further down.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const relative = (await params).path.join('/');
  if (!STORED_PATH.test(relative)) return new Response('Not found', { status: 404 });

  let body: Buffer;
  try {
    body = await readFile(join(MEDIA_ROOT(), relative));
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const isPdf = relative.endsWith('.pdf');
  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': isPdf ? 'application/pdf' : 'image/webp',
      'Content-Length': String(body.length),
      // Names are random and never reused, so the content behind a URL never changes.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      // A PDF viewer is a browser inside the browser; give it no scripts and
      // no origin of its own.
      ...(isPdf ? { 'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'" } : {}),
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  });
}
