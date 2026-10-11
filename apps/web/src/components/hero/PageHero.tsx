import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DeepBackdrop } from '@/components/ui/DeepBackdrop';
import type { BackdropVariant } from '@/components/ui/WaterBackdrop';
import { TextReveal } from '@/components/motion/TextReveal';
import { cn } from '@/lib/cn';

/**
 * The opening block of every inner page: the same deep water as the home
 * hero, at a third of the height, with the light page sliding up over its
 * rounded lower edge.
 *
 * Every page starting dark is what lets the header have one rule — white over
 * the hero, glass once scrolled — instead of a per-page theme to keep in sync.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  trail,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  /** Kept for API compatibility; every page hero now shares the deep ground. */
  backdrop?: BackdropVariant;
  trail?: Array<{ name: string; path: string }>;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('abyss grain relative isolate overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem]', className)}>
      <DeepBackdrop bubbles={false} />
      <div className="shell relative z-10 pb-12 pt-28 sm:pb-16 sm:pt-36">
        {trail ? <Breadcrumbs trail={trail} tone="light" className="mb-6" /> : null}
        <Eyebrow tone="light">{eyebrow}</Eyebrow>
        <TextReveal
          as="h1"
          split="lines"
          className="display display-lg mt-5 max-w-3xl text-white"
        >
          {title}
        </TextReveal>
        {lead ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-200">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
