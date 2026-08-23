'use client';

import { useTranslations } from 'next-intl';
import { Parallax } from '@/components/motion/Parallax';
import { TextReveal } from '@/components/motion/TextReveal';
import { Reveal } from '@/components/motion/Reveal';
import { WaterBackdrop, type BackdropVariant } from '@/components/ui/WaterBackdrop';
import { cn } from '@/lib/cn';

/**
 * One chapter of the home page narrative.
 *
 * Alternating alignment plus a parallax art panel — the same component drives
 * all five sections, which is what stops "storytelling" from becoming five
 * bespoke layouts nobody can maintain.
 */
export function StoryChapter({
  chapter,
  backdrop,
  flip = false,
}: {
  chapter: 's01' | 's02' | 's03' | 's04' | 's05';
  backdrop: BackdropVariant;
  flip?: boolean;
}) {
  const t = useTranslations(`home.story.${chapter}`);

  return (
    <section className="relative overflow-hidden bg-canvas section-y">
      <div
        className={cn(
          'shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20',
          flip && 'lg:[&>*:first-child]:order-2',
        )}
      >
        <div className="relative aspect-4/5 overflow-hidden rounded-lg sm:aspect-3/2 lg:aspect-4/5">
          <Parallax amount={0.16} className="absolute inset-[-12%]">
            <WaterBackdrop variant={backdrop} className="h-full" />
          </Parallax>
          <span className="absolute bottom-6 start-6 font-display text-5xl text-white/25 tabular">
            {t('index')}
          </span>
        </div>

        <div>
          <TextReveal
            as="h2"
            split="lines"
            className="max-w-lg font-display text-4xl leading-[1.08] text-abyss-900"
          >
            {t('title')}
          </TextReveal>
          <Reveal direction="up" delay={0.1}>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-muted">{t('body')}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
