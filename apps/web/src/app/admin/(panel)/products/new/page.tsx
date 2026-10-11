import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/forms/ProductForm';
import { requireAdmin } from '@/server/auth';

export const metadata: Metadata = { title: 'محصول تازه' };

export default async function NewProductPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader title="محصول تازه" />
      <ProductForm role={user.role} />
    </>
  );
}
