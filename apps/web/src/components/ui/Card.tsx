import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
  tone = 'light',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark' | 'glass';
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-6 transition-[transform,box-shadow] duration-(--duration-base) ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-8',
        tone === 'light' && 'border border-line bg-white/70 hover:shadow-lift',
        tone === 'dark' && 'border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
        tone === 'glass' && 'glass',
        className,
      )}
    >
      {children}
    </div>
  );
}
