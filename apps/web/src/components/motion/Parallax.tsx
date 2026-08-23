'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useParallax } from '@/animations/scroll/useParallax';

export function Parallax({
  children,
  className,
  amount = 0.18,
  axis = 'y',
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
  axis?: 'x' | 'y';
}) {
  const ref = useParallax<HTMLDivElement>({ amount, axis });
  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
