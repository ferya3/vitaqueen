import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'light' | 'dark' | 'glass' | 'solid';

/**
 * The system's one surface.
 *
 * `glass` is the default material; `solid` is for dense content where a blur
 * behind small text costs legibility, and `dark` is the inverse pane.
 */
export function Card({
  children,
  className,
  tone = 'glass',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  /** Adds the hover lift. Off by default: a card that does not link anywhere
      should not behave as if it does. */
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-water) sm:p-7',
        tone === 'glass' && 'glass',
        tone === 'light' && 'glass-strong',
        tone === 'solid' && 'border border-hairline bg-white/85',
        tone === 'dark' && 'glass-ink text-ground-200',
        interactive && 'hover:-translate-y-1 hover:shadow-float motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
