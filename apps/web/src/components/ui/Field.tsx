import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * Form primitives in the shadcn/ui manner: unstyled native elements with one
 * class recipe each, so they compose with plain `<form>` and Server Actions.
 */
const control =
  'w-full rounded-lg border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-aqua-500 focus:ring-2 focus:ring-aqua-400/30 disabled:cursor-not-allowed disabled:bg-ink-50 aria-invalid:border-red-400';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-10', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-10 pe-8', className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('grid gap-1.5 text-sm font-medium text-ink-700', className)} {...props} />;
}

export function Checkbox({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return <input type="checkbox" className={cn('size-4 rounded-xs accent-aqua-600', className)} {...props} />;
}

export function FieldHint({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('text-xs font-normal text-ink-400', className)} {...props} />;
}

export function FieldError({ className, ...props }: ComponentProps<'span'>) {
  return <span role="alert" className={cn('text-xs font-normal text-red-600', className)} {...props} />;
}
