import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail } from 'lucide-react';
import { ConfirmAction } from '@/components/admin/ConfirmAction';
import { PageHeader, Panel, StatusBadge } from '@/components/admin/ui';
import { buttonVariants } from '@/components/ui/button-variants';
import { deleteMessage, markMessageHandled } from '@/server/actions/admin';
import { requireAdmin } from '@/server/auth';
import { get, type Row } from '@/server/db';
import { parseId } from '@/server/admin-data';
import { faDateTime } from '@/lib/admin-format';
import { TOPIC_LABEL } from '@/lib/topics';
import { can } from '@/lib/roles';

export const metadata: Metadata = { title: 'پیام' };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin('editor');
  const id = parseId((await params).id);
  const message = id
    ? get<Row>('SELECT m.*, u.name AS handler FROM contact_messages m LEFT JOIN users u ON u.id = m.handled_by WHERE m.id = ?', [id])
    : undefined;
  if (!message || !id) notFound();
  const handled = !!message.handled_at;

  const facts: Array<[string, string | null]> = [
    ['نام', message.name as string],
    ['ایمیل', message.email as string],
    ['تلفن', (message.phone as string) ?? null],
    ['شرکت', (message.company as string) ?? null],
    ['دسته', TOPIC_LABEL[String(message.topic)] ?? String(message.topic)],
    ['زبان سایت', String(message.locale).toUpperCase()],
    ['زمان', faDateTime(message.created_at as string)],
    ['IP', (message.ip_address as string) ?? 'پاک شده'],
  ];

  return (
    <>
      <PageHeader
        title={String(message.subject)}
        description={handled ? <StatusBadge tone="muted">{`پاسخ داده شد · ${message.handler ?? ''} · ${faDateTime(message.handled_at as string)}`}</StatusBadge> : <StatusBadge tone="warn">بی‌پاسخ</StatusBadge>}
        actions={
          <>
            <a href={`mailto:${encodeURIComponent(String(message.email))}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`} className={buttonVariants({ size: 'sm' })}>
              <Mail className="size-4" /> پاسخ با ایمیل
            </a>
            <ConfirmAction action={markMessageHandled.bind(null, id, !handled)}>{handled ? 'برگرداندن به بی‌پاسخ' : 'علامت پاسخ‌داده‌شده'}</ConfirmAction>
            {can.deleteMessages(user.role) ? (
              <ConfirmAction action={deleteMessage.bind(null, id)} confirm="این پیام برای همیشه حذف شود؟" variant="destructive">حذف</ConfirmAction>
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel>
          <p dir="auto" className="whitespace-pre-wrap leading-loose text-ink-800">{String(message.message)}</p>
        </Panel>
        <Panel>
          <dl className="grid gap-3 text-sm">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-ink-400">{label}</dt>
                <dd dir="auto" className="break-words text-ink-800">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
      <Link href="/admin/messages" className="mt-6 inline-block text-sm text-ink-500 hover:text-heading">بازگشت به پیام‌ها</Link>
    </>
  );
}
