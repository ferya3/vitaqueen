'use client';

import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useMagnetic } from '@/animations/micro-interactions/useMagnetic';
import { buttonVariants } from './button-variants';

export { buttonVariants };

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Lean toward the cursor on precise pointers. Off by default. */
    magnetic?: boolean;
  };

export function Button({ className, variant, size, sheen, asChild = false, magnetic = false, ...props }: ButtonProps) {
  const ref = useMagnetic<HTMLButtonElement>(magnetic ? 0.22 : 0);
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size, sheen }), className)} {...props} />;
}

/**
 * A locale-aware link styled as a button, with the public site's sheen and
 * magnetic pull. The magnetic transform sits on a wrapper rather than on the
 * link itself, so it does not depend on how next-intl forwards refs.
 */
export function ButtonLink({
  variant,
  size,
  className,
  magnetic = true,
  ...props
}: Omit<ComponentProps<typeof Link>, 'className'> &
  Omit<VariantProps<typeof buttonVariants>, 'sheen'> & { className?: string; magnetic?: boolean }) {
  const ref = useMagnetic<HTMLSpanElement>(magnetic ? 0.22 : 0);
  return (
    <span ref={ref} className="inline-flex">
      <Link className={cn(buttonVariants({ variant, size, sheen: true }), className)} {...props} />
    </span>
  );
}
