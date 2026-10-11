import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { AnalysisForm } from '@/components/admin/forms/AnalysisForm';
import { requireAdmin } from '@/server/auth';

export const metadata: Metadata = { title: 'آنالیز تازه' };

export default async function NewPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader title="آنالیز تازه" />
      <AnalysisForm role={user.role} />
    </>
  );
}
