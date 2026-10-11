import type { Metadata } from 'next';
import { EmptyState, NewButton, PageHeader, PublishedBadge, RowLink, StatusBadge, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { fa } from '@/server/admin-data';
import { faNumber } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'محصولات' };

export default async function ProductsPage() {
  await requireAdmin();
  const products = all<Row>('SELECT id, slug, sku, name, volume_ml, featured, is_published, position FROM products ORDER BY position, id');

  return (
    <>
      <PageHeader title="محصولات" description="هر حجم بطری یک محصول است. مشخصات فنی، تصاویر و گواهی‌نامه‌ها در صفحه‌ی هر محصول ویرایش می‌شوند." actions={<NewButton href="/admin/products/new" label="محصول تازه" />} />
      {products.length === 0 ? (
        <EmptyState>هنوز محصولی ثبت نشده است.</EmptyState>
      ) : (
        <Table head={['نام', 'حجم', 'کد کالا', 'وضعیت', 'ترتیب']}>
          {products.map((product) => (
            <tr key={String(product.id)}>
              <td>
                <RowLink href={`/admin/products/${product.id}`}>{fa(product.name)}</RowLink>
                {Number(product.featured) === 1 ? <span className="ms-2"><StatusBadge tone="warn">ویژه</StatusBadge></span> : null}
              </td>
              <td className="tabular-nums">{faNumber(Number(product.volume_ml))} ml</td>
              <td dir="ltr" className="text-end font-mono text-xs">{String(product.sku)}</td>
              <td><PublishedBadge published={Number(product.is_published) === 1} /></td>
              <td className="tabular-nums">{faNumber(Number(product.position))}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
