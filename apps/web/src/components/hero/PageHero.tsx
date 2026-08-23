import type { ReactNode } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WaterBackdrop, type BackdropVariant } from '@/components/ui/WaterBackdrop';
import { TextReveal } from '@/components/motion/TextReveal';
import { cn } from '@/lib/cn';

/**
 * The opening band of every inner page.
 *
 * Every page starts dark on purpose: the header is fixed and transparent at the
 * top of the document, so a light-on-dark hero is what keeps the navigation
 * legible without a second header theme to maintain.
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
    <section className={cn('relative overflow-hidden bg-abyss-950 text-mist-50', className)}>
      <WaterBackdrop variant={backdrop} />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-abyss-950 via-abyss-950/35 to-abyss-950/70"
      />

      <div className="shell relative z-10 pb-20 pt-36 sm:pt-44">
        {trail ? <Breadcrumbs trail={trail} tone="light" className="mb-8" /> : null}
        <Eyebrow tone="light">{eyebrow}</Eyebrow>
        <TextReveal
          as="h1"
          split="lines"
          className="mt-6 max-w-4xl font-display text-5xl leading-(--leading-display)"
        >
          {title}
        </TextReveal>
        {lead ? (
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-mist-300">{lead}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
