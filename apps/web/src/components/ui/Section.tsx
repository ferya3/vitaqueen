import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'canvas' | 'deep' | 'mist' | 'transparent';

const toneClass: Record<Tone, string> = {
  canvas: 'bg-canvas text-ink',
  deep: 'bg-abyss-950 text-mist-100',
  mist: 'bg-mist-200 text-ink',
  transparent: '',
};

/** Page-level band. Owns vertical rhythm and background tone; nothing else. */
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
  return (
    <Tag
      id={id}
      // `scroll-mt` keeps in-page anchors clear of the fixed header.
      className={cn('relative scroll-mt-24 section-y', toneClass[tone], className)}
    >
      {bleed ? children : <div className="shell">{children}</div>}
    </Tag>
  );
}

export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('shell', className)}>{children}</div>;
}
