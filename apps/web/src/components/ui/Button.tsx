'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useMagnetic } from '@/animations/micro-interactions/useMagnetic';

type Variant = 'primary' | 'secondary' | 'ghost' | 'light';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-pill font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  // The one saturated fill in the system. Everything else defers to it.
  primary: 'bg-aqua-500 text-white shadow-float hover:bg-aqua-600 active:translate-y-px',
  // Glass, so it sits on the aurora instead of punching a hole in it.
  secondary: 'glass text-heading hover:-translate-y-0.5 hover:shadow-float active:translate-y-0',
  ghost: 'text-ink-700 hover:bg-ink-900/6 hover:text-heading',
  light: 'bg-white text-heading shadow-press hover:bg-ground-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-7 text-base',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  /** Disables the cursor-follow effect, e.g. inside a dense table. */
  magnetic?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  magnetic = true,
  ...props
}: CommonProps & ComponentProps<'button'>) {
  const ref = useMagnetic<HTMLButtonElement>(magnetic ? 0.22 : 0);
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      <Sheen />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  magnetic = true,
  href,
  ...props
}: CommonProps & Omit<ComponentProps<typeof Link>, 'className' | 'children'>) {
  // The magnetic transform sits on a wrapper rather than on `Link` itself so
  // this does not depend on how next-intl forwards refs.
  const ref = useMagnetic<HTMLSpanElement>(magnetic ? 0.22 : 0);
  return (
    <span ref={ref} className="inline-flex">
      <Link
        href={href}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        <Sheen />
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Link>
    </span>
  );
}

/** A slow highlight that crosses the button on hover — the "water" tell. */
function Sheen() {
  return (
    <span
      aria-hidden
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-full motion-reduce:hidden"
    />
  );
}
