import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { AdminForm } from '@/components/admin/AdminForm';
import { FileField } from '@/components/admin/fields';
import { EmptyState, PageHeader, Panel } from '@/components/admin/ui';
import { uploadMedia } from '@/server/actions/admin';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { mediaUrl } from '@/server/media-url';
import { faDate } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'رسانه‌ها' };

const sizeLabel = (bytes: number) => (bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`);

export default async function MediaPage() {
  await requireAdmin();
  const rows = all<Row>('SELECT id, kind, path, original_name, size_bytes, width, height, created_at FROM media ORDER BY created_at DESC LIMIT 300');

  return (
    <>
      <PageHeader title="رسانه‌ها" description="همه‌ی تصویرها و PDFهای بارگذاری‌شده. تصویرها به WebP با حداکثر ضلع ۲۵۶۰ پیکسل تبدیل می‌شوند و فراداده‌ی EXIF (از جمله موقعیت مکانی) حذف می‌شود." />
      <Panel className="mb-6">
        <AdminForm action={uploadMedia} submitLabel="بارگذاری">
          <FileField name="files" label="انتخاب فایل" accept="image/*,application/pdf" multiple hint="تصویر تا ۱۲ مگابایت، PDF تا ۲۰ مگابایت. SVG پذیرفته نمی‌شود." />
        </AdminForm>
      </Panel>
      {rows.length === 0 ? (
        <EmptyState>هنوز فایلی بارگذاری نشده است.</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((row) => (
            <li key={String(row.id)}>
              <Link href={`/admin/media/${row.id}`} className="group block overflow-hidden rounded-xl border border-hairline bg-white transition-shadow hover:shadow-float">
                <div className="grid aspect-square place-items-center bg-ground-50">
                  {row.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(String(row.path))} alt="" loading="lazy" className="size-full object-contain" />
                  ) : (
                    <FileText className="size-10 text-ink-300" />
                  )}
                </div>
                <div className="px-3 py-2 text-xs">
                  <p className="truncate font-medium text-ink-700" dir="auto">{String(row.original_name)}</p>
                  <p className="mt-0.5 text-ink-400">
                    {row.width ? `${row.width}×${row.height} · ` : 'PDF · '}
                    {sizeLabel(Number(row.size_bytes))} · {faDate(row.created_at as string)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
