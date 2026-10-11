import Link from 'next/link';
import { AdminForm } from '@/components/admin/AdminForm';
import { CheckboxField, SelectField, TextField } from '@/components/admin/fields';
import { saveUser } from '@/server/actions/admin';
import type { Row } from '@/server/db';
import { ROLE_LABEL, ROLE_LEVEL, atLeast, type Role } from '@/lib/roles';

export function UserForm({ user, actorRole, self }: { user?: Row; actorRole: Role; self?: boolean }) {
  const roles = (Object.keys(ROLE_LEVEL) as Role[])
    .filter((role) => atLeast(actorRole, role))
    .sort((a, b) => ROLE_LEVEL[a] - ROLE_LEVEL[b])
    .map((role) => ({ value: role, label: ROLE_LABEL[role] }));

  return (
    <AdminForm
      action={saveUser.bind(null, user ? Number(user.id) : null)}
      submitLabel={user ? 'ذخیره' : 'ساخت حساب'}
      footer={<Link href="/admin/users" className="text-sm text-ink-500 hover:text-heading">بازگشت</Link>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="name" label="نام" defaultValue={user?.name as string} required />
        <TextField name="email" label="ایمیل" defaultValue={user?.email as string} dir="ltr" inputMode="email" required />
        <SelectField name="role" label="نقش" defaultValue={(user?.role as string) ?? 'content_manager'} options={roles} />
      </div>
      <CheckboxField
        name="is_active"
        label="حساب فعال است"
        defaultChecked={user ? Number(user.is_active) === 1 : true}
        hint={self ? 'حساب خودتان را از اینجا نمی‌توانید غیرفعال کنید.' : 'غیرفعال کردن، همه‌ی نشست‌های این کاربر را می‌بندد.'}
      />
    </AdminForm>
  );
}
