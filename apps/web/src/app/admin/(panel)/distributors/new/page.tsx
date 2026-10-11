import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { DistributorForm } from '@/components/admin/forms/DistributorForm';
import { requireAdmin } from '@/server/auth';

export const metadata: Metadata = { title: 'نماینده‌ی تازه' };

export default async function NewPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader title="نماینده‌ی تازه" />
      <DistributorForm role={user.role} />
    </>
  );
}
