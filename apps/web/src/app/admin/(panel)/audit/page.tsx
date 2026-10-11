import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader, Table } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { all, type Row } from '@/server/db';
import { faDateTime } from '@/lib/admin-format';

export const metadata: Metadata = { title: 'گزارش رویدادها' };

const ACTION_LABEL: Record<string, string> = {
  created: 'ایجاد',
  updated: 'ویرایش',
  deleted: 'حذف',
  login_succeeded: 'ورود موفق',
  login_failed: 'ورود ناموفق',
  logged_out: 'خروج',
  password_changed: 'تغییر رمز',
  password_reset: 'بازنشانی رمز',
  two_factor_enabled: 'فعال‌سازی ۲FA',
  two_factor_disabled: 'غیرفعال‌سازی ۲FA',
  two_factor_failed: 'کد ۲FA نادرست',
  recovery_code_used: 'استفاده از کد بازیابی',
  media_uploaded: 'بارگذاری فایل',
  media_deleted: 'حذف فایل',
  message_handled: 'وضعیت پیام',
  user_created: 'ساخت کاربر',
};

const PAGE = 100;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  await requireAdmin('admin');
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const action = query.action && query.action in ACTION_LABEL ? query.action : null;

  const rows = all<Row>(
    `SELECT * FROM audit_logs ${action ? 'WHERE action = ?' : ''} ORDER BY id DESC LIMIT ? OFFSET ?`,
    action ? [action, PAGE + 1, (page - 1) * PAGE] : [PAGE + 1, (page - 1) * PAGE],
  );
  const hasMore = rows.length > PAGE;
  const href = (next: number) => `/admin/audit?page=${next}${action ? `&action=${action}` : ''}`;

  return (
    <>
      <PageHeader
        title="گزارش رویدادها"
        description="چه کسی، چه زمانی، چه چیزی را تغییر داد. این گزارش فقط اضافه می‌شود و پس از دو سال خودکار پاک می‌شود."
        actions={
          <form className="flex items-center gap-2 text-sm">
            <select name="action" defaultValue={action ?? ''} className="h-9 rounded-lg border border-ink-200 bg-white px-2">
              <option value="">همه‌ی رویدادها</option>
              {Object.entries(ACTION_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button className="h-9 rounded-lg bg-ink-900/6 px-3 hover:bg-ink-900/10">فیلتر</button>
          </form>
        }
      />
      {rows.length === 0 ? (
        <EmptyState>رویدادی ثبت نشده است.</EmptyState>
      ) : (
        <Table head={['زمان', 'کاربر', 'رویداد', 'مورد', 'جزئیات', 'IP']}>
          {rows.slice(0, PAGE).map((row) => (
            <tr key={String(row.id)}>
              <td className="whitespace-nowrap text-xs">{faDateTime(row.created_at as string)}</td>
              <td dir="ltr" className="text-end text-xs">{(row.user_email as string) ?? '—'}</td>
              <td className={row.action === 'login_failed' || row.action === 'two_factor_failed' ? 'text-red-600' : undefined}>
                {ACTION_LABEL[String(row.action)] ?? String(row.action)}
              </td>
              <td dir="ltr" className="text-end font-mono text-xs">{row.resource_type ? `${row.resource_type}#${row.resource_id ?? ''}` : '—'}</td>
              <td dir="ltr" className="max-w-72 truncate text-end font-mono text-2xs text-ink-500" title={(row.details as string) ?? ''}>{(row.details as string) ?? ''}</td>
              <td dir="ltr" className="text-end font-mono text-xs">{(row.ip_address as string) ?? ''}</td>
            </tr>
          ))}
        </Table>
      )}
      <nav className="mt-4 flex justify-between text-sm">
        {page > 1 ? <Link href={href(page - 1)} className="text-aqua-700 hover:underline">→ جدیدتر</Link> : <span />}
        {hasMore ? <Link href={href(page + 1)} className="text-aqua-700 hover:underline">قدیمی‌تر ←</Link> : null}
      </nav>
    </>
  );
}
