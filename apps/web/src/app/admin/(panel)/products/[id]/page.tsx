import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { PageHeader, PublishedBadge } from '@/components/admin/ui';
import { CreatedNotice } from '@/components/admin/CreatedNotice';
import { ProductForm } from '@/components/admin/forms/ProductForm';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { fa, parseId } from '@/server/admin-data';

export const metadata: Metadata = { title: 'ویرایش محصول' };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requireAdmin();
  const id = parseId((await params).id);
  const product = id ? get<Row>('SELECT * FROM products WHERE id = ?', [id]) : undefined;
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={fa(product.name)}
        description={<PublishedBadge published={Number(product.is_published) === 1} />}
        actions={
          <Link href={`/fa/products/${product.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-aqua-700 hover:underline">
            مشاهده در سایت <ExternalLink className="size-3.5" />
          </Link>
        }
      />
      {(await searchParams).created ? <CreatedNotice /> : null}
      <ProductForm product={product} role={user.role} />
    </>
  );
}
