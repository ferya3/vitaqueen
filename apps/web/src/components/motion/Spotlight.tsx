'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * A surface that lights up under the cursor. The glow itself is the
 * `.spotlight::before` gradient in `globals.css`; this only feeds it the
 * pointer position as CSS variables, so React never re-renders on move.
 */
export function Spotlight({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('spotlight', className)}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }}
      {...props}
    />
  );
}
