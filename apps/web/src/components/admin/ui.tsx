import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/cn';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-heading">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function NewButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonVariants({ size: 'sm' })}>
      <Plus className="size-4" />
      {label}
    </Link>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-hairline bg-white/90 p-5 shadow-glass sm:p-6', className)}>{children}</div>;
}

export function StatusBadge({ tone, children }: { tone: 'live' | 'draft' | 'warn' | 'muted'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-2xs font-semibold whitespace-nowrap',
        tone === 'live' && 'bg-mint-100 text-mint-700',
        tone === 'draft' && 'bg-ink-100 text-ink-600',
        tone === 'warn' && 'bg-amber-100 text-amber-800',
        tone === 'muted' && 'bg-ink-50 text-ink-400',
      )}
    >
      {children}
    </span>
  );
}

export function PublishedBadge({ published }: { published: boolean }) {
  return <StatusBadge tone={published ? 'live' : 'draft'}>{published ? 'منتشرشده' : 'پیش‌نویس'}</StatusBadge>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-ink-200 px-6 py-10 text-center text-sm text-ink-500">{children}</p>;
}

/**
 * A table that stays readable on a phone by scrolling inside its own frame,
 * rather than widening the whole page.
 */
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline bg-white/90 shadow-glass">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-hairline bg-ground-50 text-start text-xs text-ink-500">
            {head.map((label, index) => (
              <th key={index} className="px-4 py-3 text-start font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle">{children}</tbody>
      </table>
    </div>
  );
}

export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-heading hover:text-aqua-700 hover:underline">
      {children}
    </Link>
  );
}
