'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePinnedSequence } from '@/animations/scroll/usePinnedSequence';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { cn } from '@/lib/cn';

const STEPS = ['spring', 'water', 'filtration', 'laboratory', 'bottling', 'product'] as const;

/**
 * The signature interaction: the section pins and the visitor scrolls the water
 * down its own route, from the spring to the sealed bottle.
 *
 * One DOM tree serves both modes. On a desktop the panels stack in the same
 * box and cross-fade as the pinned timeline advances; below `lg`, and whenever
 * motion is reduced, the exact same panels simply flow down the page. Nothing
 * is duplicated for the sake of the animation, so the content stays correct for
 * assistive technology and for crawlers.
 */
export function JourneySequence() {
  const t = useTranslations('home.journey');
  const [active, setActive] = useState(0);

  const onStep = useCallback((index: number) => setActive(index), []);
  const containerRef = usePinnedSequence<HTMLElement>({ steps: STEPS.length, onStep });

  const progress = (active + 1) / STEPS.length;

  return (
    <section
      id="journey"
      ref={containerRef}
      className="relative overflow-hidden bg-abyss-950 text-mist-100"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(70% 55% at 15% 0%, #0a6796 0%, transparent 60%), radial-gradient(60% 50% at 90% 100%, #10567b 0%, transparent 60%)',
        }}
      />

      <div className="shell relative z-10 grid gap-10 py-14 sm:gap-14 sm:py-24 lg:h-screen lg:grid-cols-[16rem_1fr] lg:items-center lg:gap-24 lg:py-0">
        <div>
          <Eyebrow tone="light">{t('eyebrow')}</Eyebrow>
          <h2 className="mt-6 max-w-xs font-display text-3xl leading-tight">{t('title')}</h2>

          {/* Step rail. Doubles as the progress indicator while pinned. */}
          <ol className="mt-10 hidden gap-0 lg:flex lg:flex-col">
            {STEPS.map((step, index) => (
              <li key={step} className="relative flex items-center gap-4 py-2.5">
                <span
                  className={cn(
                    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border text-xs tabular transition-colors duration-(--duration-base)',
                    index <= active
                      ? 'border-aqua-400 bg-aqua-400/15 text-aqua-200'
                      : 'border-white/15 text-mist-500',
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'text-sm transition-colors duration-(--duration-base)',
                    index === active ? 'text-white' : 'text-mist-500',
                  )}
                >
                  {t(`${step}.title`)}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 hidden h-px w-full bg-white/10 lg:block">
            <div
              className="h-px bg-aqua-400 transition-[width] duration-(--duration-base) ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div className="relative lg:min-h-[24rem]">
          {STEPS.map((step, index) => (
            <article
              key={step}
              data-sequence-step
              aria-hidden={undefined}
              className={cn(
                'border-t border-white/10 py-7 first:border-t-0 sm:py-10 lg:absolute lg:inset-0 lg:border-0 lg:py-0',
                'lg:transition-[opacity,transform] lg:duration-(--duration-slow) lg:ease-[cubic-bezier(0.22,1,0.36,1)]',
                index === active
                  ? 'lg:pointer-events-auto lg:translate-y-0 lg:opacity-100'
                  : 'lg:pointer-events-none lg:translate-y-6 lg:opacity-0',
              )}
            >
              <div className="flex items-baseline gap-5">
                <span className="font-display text-4xl text-white/10 tabular sm:text-6xl lg:text-8xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-2xl text-white sm:text-3xl lg:text-5xl">
                  {t(`${step}.title`)}
                </h3>
              </div>
              <p className="mt-4 max-w-xl leading-relaxed text-mist-300 sm:mt-6 sm:text-lg">
                {t(`${step}.body`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
