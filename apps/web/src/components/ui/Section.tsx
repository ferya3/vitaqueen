import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'canvas' | 'mist' | 'deep' | 'transparent';

/**
 * Page-level band.
 *
 * The document already carries the aurora gradient, so `canvas` is simply a
 * hole through to it. `mist` is a frosted band for a run of dense content, and
 * `deep` is the one dark surface in the system — a rounded ink slab used
 * sparingly, where a light-on-dark contrast is the point.
 */
const toneClass: Record<Tone, string> = {
  canvas: '',
  mist: 'border-y border-white/70 bg-white/55 backdrop-blur-xl',
  deep: '',
  transparent: '',
};

export function Section({
  children,
  className,
  tone = 'canvas',
  id,
  as: Tag = 'section',
  bleed = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  id?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
  /** Skip the horizontal gutter for full-bleed media. */
  bleed?: boolean;
}) {
  const ink = tone === 'deep';

  return (
    <Tag
      id={id}
      // `scroll-mt` keeps in-page anchors clear of the floating header.
      className={cn(
        'relative scroll-mt-20 sm:scroll-mt-24',
        ink ? 'shell py-6 sm:py-10' : 'section-y',
        toneClass[tone],
        className,
      )}
    >
      {bleed ? (
        children
      ) : ink ? (
        <div className="glass-ink rounded-2xl px-6 py-9 text-ground-200 sm:px-10 sm:py-14">
          {children}
        </div>
      ) : (
        <div className="shell">{children}</div>
      )}
    </Tag>
  );
}

export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('shell', className)}>{children}</div>;
}

/**
 * The heading block that opens a section: eyebrow, title, lede — always in the
 * same order, always with the same spacing, so no two sections drift apart.
 */
export function SectionHead({
  eyebrow,
  title,
  lede,
  align = 'start',
  tone = 'default',
  className,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'start' | 'center';
  tone?: 'default' | 'light';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow}
      <h2
        className={cn(
          'text-3xl sm:text-4xl',
          tone === 'light' && 'text-ground-50',
        )}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            'max-w-xl text-base leading-relaxed',
            tone === 'light' ? 'text-ink-200' : 'text-ink-500',
          )}
        >
          {lede}
        </p>
      ) : null}
      {children}
    </div>
  );
}
