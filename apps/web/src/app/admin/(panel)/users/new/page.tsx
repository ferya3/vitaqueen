import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/ui';
import { UserForm } from '@/components/admin/forms/UserForm';
import { requireAdmin } from '@/server/auth';

export const metadata: Metadata = { title: 'کاربر تازه' };

export default async function NewUserPage() {
  const actor = await requireAdmin('admin');
  return (
    <>
      <PageHeader title="کاربر تازه" description="یک رمز اولیه‌ی تصادفی ساخته و فقط یک بار نمایش داده می‌شود." />
      <Panel>
        <UserForm actorRole={actor.role} />
      </Panel>
    </>
  );
}
