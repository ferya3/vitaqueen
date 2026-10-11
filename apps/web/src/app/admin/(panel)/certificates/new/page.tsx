import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { CertificateForm } from '@/components/admin/forms/CertificateForm';
import { requireAdmin } from '@/server/auth';

export const metadata: Metadata = { title: 'گواهی‌نامه‌ی تازه' };

export default async function NewPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader title="گواهی‌نامه‌ی تازه" />
      <CertificateForm role={user.role} />
    </>
  );
}
