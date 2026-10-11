import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, FileField, LocalizedField, TextField } from '@/components/admin/fields';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { MarkupHelp } from '@/components/admin/MarkupHelp';
import { Panel } from '@/components/admin/ui';
import { deleteArticle, saveArticle } from '@/server/actions/content';
import { mediaInfo, t } from '@/server/admin-data';
import type { Row } from '@/server/db';
import { can, type Role } from '@/lib/roles';

export function ArticleForm({ article, role }: { article?: Row; role: Role }) {
  const id = article ? Number(article.id) : null;
  const tags = (() => {
    try {
      return (JSON.parse(String(article?.tags ?? '[]')) as string[]).join('، ');
    } catch {
      return '';
    }
  })();

  return (
    <Panel>
      <AdminForm
        action={saveArticle.bind(null, id)}
        footer={
          <>
            <Link href="/admin/news" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>
            {id && can.deleteContent(role) ? (
              <span className="ms-auto">
                <ConfirmAction action={deleteArticle.bind(null, id)} confirm="این خبر حذف شود؟" variant="destructive">حذف</ConfirmAction>
              </span>
            ) : null}
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField name="slug" label="نامک" defaultValue={article?.slug as string} dir="ltr" required hint="مثل new-bottling-line" />
          <TextField
            name="published_at"
            label="تاریخ انتشار (میلادی)"
            type="date"
            defaultValue={article?.published_at ? String(article.published_at).slice(0, 10) : ''}
            dir="ltr"
            hint="خالی یعنی همین حالا؛ تاریخ آینده یعنی زمان‌بندی‌شده."
          />
          <TextField name="tags" label="برچسب‌ها" defaultValue={tags} hint="با ویرگول جدا کنید." />
        </div>
        <LocalizedField name="title" label="عنوان" values={t(article?.title)} required />
        <LocalizedField name="excerpt" label="خلاصه" values={t(article?.excerpt)} multiline rows={2} />
        <LocalizedField name="body" label="متن" values={t(article?.body)} multiline rows={12} hint={<MarkupHelp />} />
        <FileField name="cover" label="تصویر شاخص" accept="image/*" current={mediaInfo(article?.cover_media_id)} removeName="remove_cover" />
        <CheckboxField
          name="is_published"
          label="منتشر در سایت"
          defaultChecked={Number(article?.is_published) === 1}
          disabled={!can.publish(role)}
          hint={can.publish(role) ? undefined : 'انتشار با ویراستار یا مدیر است.'}
        />
      </AdminForm>
    </Panel>
  );
}
