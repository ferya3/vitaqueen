import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { ArticleForm } from '@/components/admin/forms/ArticleForm';
import { requireAdmin } from '@/server/auth';

export const metadata: Metadata = { title: 'خبر تازه' };

export default async function NewPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader title="خبر تازه" />
      <ArticleForm role={user.role} />
    </>
  );
}
