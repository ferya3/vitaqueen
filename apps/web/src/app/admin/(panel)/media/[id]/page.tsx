import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminForm } from '@/components/admin/AdminForm';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { LocalizedField } from '@/components/admin/fields';
import { PageHeader, Panel } from '@/components/admin/ui';
import { removeMedia, saveMediaAlt } from '@/server/actions/admin';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { parseId, t } from '@/server/admin-data';
import { mediaUrl } from '@/server/media-url';
import { can } from '@/lib/roles';

export const metadata: Metadata = { title: 'جزئیات فایل' };

export default async function MediaItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const id = parseId((await params).id);
  const media = id ? get<Row>('SELECT * FROM media WHERE id = ?', [id]) : undefined;
  if (!media || !id) notFound();
  const url = mediaUrl(String(media.path));

  return (
    <>
      <PageHeader title={String(media.original_name)} description={<a href={url} target="_blank" rel="noreferrer" dir="ltr" className="text-aqua-700 hover:underline">{url}</a>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Panel className="grid place-items-center">
          {media.kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="max-h-96 w-auto rounded-lg object-contain" />
          ) : (
            <a href={url} target="_blank" rel="noreferrer" className="text-aqua-700 hover:underline">باز کردن PDF</a>
          )}
        </Panel>
        <Panel>
          <AdminForm
            action={saveMediaAlt.bind(null, id)}
            footer={
              <>
                <Link href="/admin/media" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>
                {can.deleteContent(user.role) ? (
                  <span className="ms-auto">
                    <ConfirmAction action={removeMedia.bind(null, id)} confirm="فایل حذف شود؟ هر جا استفاده شده باشد از آنجا برداشته می‌شود." variant="destructive">
                      حذف فایل
                    </ConfirmAction>
                  </span>
                ) : null}
              </>
            }
          >
            <LocalizedField name="alt" label="متن جایگزین (برای نابینایان و موتورهای جستجو)" values={t(media.alt)} hint="آنچه در تصویر دیده می‌شود را کوتاه توصیف کنید." />
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
