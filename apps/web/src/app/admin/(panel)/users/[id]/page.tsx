import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminForm } from '@/components/admin/AdminForm';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { PageHeader, Panel, StatusBadge } from '@/components/admin/ui';
import { UserForm } from '@/components/admin/forms/UserForm';
import { deleteUser, resetUserPassword, resetUserTwoFactor } from '@/server/actions/admin';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { parseId } from '@/server/admin-data';
import { faDateTime } from '@/lib/admin-format';
import { atLeast, can, isRole } from '@/lib/roles';

export const metadata: Metadata = { title: 'ویرایش کاربر' };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin('admin');
  const id = parseId((await params).id);
  const user = id ? get<Row>('SELECT id, name, email, role, is_active, totp_confirmed_at, last_login_at, last_login_ip FROM users WHERE id = ?', [id]) : undefined;
  if (!user || !id || !isRole(user.role)) notFound();

  const self = id === actor.id;
  const manageable = atLeast(actor.role, user.role);

  return (
    <>
      <PageHeader
        title={String(user.name)}
        description={`آخرین ورود: ${faDateTime(user.last_login_at as string)}${user.last_login_ip ? ` از ${user.last_login_ip}` : ''}`}
      />
      {manageable ? (
        <div className="grid gap-6">
          <Panel>
            <UserForm user={user} actorRole={actor.role} self={self} />
          </Panel>
          {!self ? (
            <Panel>
              <h2 className="mb-4 font-semibold text-heading">امنیت حساب</h2>
              <div className="grid gap-6">
                <AdminForm action={resetUserPassword.bind(null, id)} submitLabel="ساخت رمز تازه" confirm="رمز فعلی این کاربر باطل و یک رمز تازه ساخته شود؟">
                  <p className="text-sm text-ink-600">یک رمز تصادفی تازه می‌سازد، یک بار نمایش می‌دهد و همه‌ی نشست‌های این کاربر را می‌بندد.</p>
                </AdminForm>
                <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-5 text-sm">
                  تأیید دومرحله‌ای: {user.totp_confirmed_at ? <StatusBadge tone="live">فعال</StatusBadge> : <StatusBadge tone="warn">فعال نیست</StatusBadge>}
                  {user.totp_confirmed_at ? (
                    <ConfirmAction action={resetUserTwoFactor.bind(null, id)} confirm="تأیید دومرحله‌ای این کاربر برداشته شود؟ در ورود بعدی دوباره تنظیمش می‌کند.">
                      بازنشانی (گوشی گم شده)
                    </ConfirmAction>
                  ) : null}
                  {can.deleteUsers(actor.role) ? (
                    <span className="ms-auto">
                      <ConfirmAction action={deleteUser.bind(null, id)} confirm="این حساب برای همیشه حذف شود؟ غیرفعال کردن معمولاً کافی است." variant="destructive">
                        حذف حساب
                      </ConfirmAction>
                    </span>
                  ) : null}
                </div>
              </div>
            </Panel>
          ) : null}
        </div>
      ) : (
        <Panel>این کاربر نقشی بالاتر از شما دارد.</Panel>
      )}
    </>
  );
}
