import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/ui';
import { CreatedNotice } from '@/components/admin/CreatedNotice';
import { DistributorForm } from '@/components/admin/forms/DistributorForm';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { parseId } from '@/server/admin-data';

export const metadata: Metadata = { title: 'ویرایش نماینده' };

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireAdmin();
  const id = parseId((await params).id);
  const row = id ? get<Row>('SELECT * FROM distributors WHERE id = ?', [id]) : undefined;
  if (!row) notFound();

  return (
    <>
      <PageHeader title={String(row.company)} />
      {(await searchParams).created ? <CreatedNotice /> : null}
      <DistributorForm distributor={row} role={user.role} />
    </>
  );
}
