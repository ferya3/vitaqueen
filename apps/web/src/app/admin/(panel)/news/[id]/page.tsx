import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { CreatedNotice } from '@/components/admin/CreatedNotice';
import { ArticleForm } from '@/components/admin/forms/ArticleForm';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { fa, parseId } from '@/server/admin-data';

export const metadata: Metadata = { title: 'ویرایش خبر' };

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireAdmin();
  const id = parseId((await params).id);
  const row = id ? get<Row>('SELECT * FROM news_articles WHERE id = ?', [id]) : undefined;
  if (!row) notFound();

  return (
    <>
      <PageHeader title={fa(row.title)} />
      {(await searchParams).created ? <CreatedNotice /> : null}
      <ArticleForm article={row} role={user.role} />
    </>
  );
}
