import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The system's one surface, composed shadcn/ui-style.
 *
 * `glass` is the default material; `solid` is for dense content where a blur
 * behind small text costs legibility, and `dark` is the inverse pane.
 */
export const cardVariants = cva(
  'rounded-xl p-6 transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-water) sm:p-7',
  {
    variants: {
      tone: {
        glass: 'glass',
        light: 'glass-strong',
        solid: 'border border-hairline bg-white/85',
        dark: 'glass-ink text-ground-200',
      },
      /** Hover lift. Off by default: a card that does not link anywhere should
          not behave as if it does. */
      interactive: {
        true: 'hover:-translate-y-1 hover:shadow-float motion-reduce:hover:translate-y-0',
        false: '',
      },
    },
    defaultVariants: { tone: 'glass', interactive: false },
  },
);

export function Card({ className, tone, interactive, ...props }: ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return <div className={cn(cardVariants({ tone, interactive }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mb-5 flex flex-col gap-1.5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 className={cn('text-lg font-semibold text-heading', className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-ink-500', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex flex-wrap items-center gap-3', className)} {...props} />;
}
