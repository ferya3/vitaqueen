import type { Metadata } from 'next';
import { NewButton, PageHeader, RowLink, StatusBadge, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { faDateTime } from '@/lib/admin-format';
import { ROLE_LABEL, isRole } from '@/lib/roles';

export const metadata: Metadata = { title: 'کاربران' };

export default async function UsersPage() {
  await requireAdmin('admin');
  const rows = all<Row>('SELECT id, name, email, role, is_active, totp_confirmed_at, last_login_at FROM users ORDER BY is_active DESC, name');

  return (
    <>
      <PageHeader
        title="کاربران پنل"
        description="مدیر محتوا می‌نویسد و ویرایش می‌کند؛ ویراستار منتشر می‌کند، حذف می‌کند و پیام‌ها را می‌خواند؛ مدیر کاربران را مدیریت می‌کند."
        actions={<NewButton href="/admin/users/new" label="کاربر تازه" />}
      />
      <Table head={['نام', 'ایمیل', 'نقش', 'تأیید دومرحله‌ای', 'آخرین ورود']}>
        {rows.map((row) => (
          <tr key={String(row.id)} className={Number(row.is_active) === 1 ? undefined : 'opacity-50'}>
            <td>
              <RowLink href={`/admin/users/${row.id}`}>{String(row.name)}</RowLink>
              {Number(row.is_active) === 1 ? null : <span className="ms-2"><StatusBadge tone="muted">غیرفعال</StatusBadge></span>}
            </td>
            <td dir="ltr" className="text-end">{String(row.email)}</td>
            <td>{isRole(row.role) ? ROLE_LABEL[row.role] : String(row.role)}</td>
            <td>{row.totp_confirmed_at ? <StatusBadge tone="live">فعال</StatusBadge> : <StatusBadge tone="warn">فعال نیست</StatusBadge>}</td>
            <td className="whitespace-nowrap">{faDateTime(row.last_login_at as string)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
