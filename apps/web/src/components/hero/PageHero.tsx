import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WaterBackdrop, type BackdropVariant } from '@/components/ui/WaterBackdrop';
import { TextReveal } from '@/components/motion/TextReveal';
import { cn } from '@/lib/cn';

/**
 * The opening block of every inner page.
 *
 * A rounded glass slab rather than a full-bleed band: the header floats above
 * it in the same light scheme, so there is no second navigation theme to keep
 * in sync, and the page's own gradient stays visible around the edges.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  backdrop = 'depth',
  trail,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  backdrop?: BackdropVariant;
  trail?: Array<{ name: string; path: string }>;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('shell pt-22 sm:pt-28', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-white/70 shadow-glass">
        <WaterBackdrop variant={backdrop} />

        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-16">
          {trail ? <Breadcrumbs trail={trail} className="mb-5" /> : null}
          <Eyebrow>{eyebrow}</Eyebrow>
          <TextReveal as="h1" split="lines" className="mt-4 max-w-3xl text-4xl sm:text-5xl">
            {title}
          </TextReveal>
          {lead ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">{lead}</p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
