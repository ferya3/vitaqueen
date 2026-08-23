'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePinnedSequence } from '@/animations/scroll/usePinnedSequence';
import { WaterBackdrop } from '@/components/ui/WaterBackdrop';
import { cn } from '@/lib/cn';
import type { ProductionStage } from '@/types/content';

/**
 * The production line, walked stage by stage.
 *
 * Same mechanism as the home page journey, but each stage can also carry its
 * own media and metrics from the CMS (line speed, technology, control point),
 * because that is the detail a distributor or an auditor actually reads.
 */
export function ProcessSequence({ stages }: { stages: ProductionStage[] }) {
  const t = useTranslations('factory.stages');
  const metrics = useTranslations('factory.metrics');
  const [active, setActive] = useState(0);

  const onStep = useCallback((index: number) => setActive(index), []);
  const ref = usePinnedSequence<HTMLElement>({ steps: stages.length, onStep });

  return (
    <section
      id="production-line"
      ref={ref}
      className="relative overflow-hidden bg-abyss-950 text-mist-100"
    >
      <WaterBackdrop variant="line" className="opacity-60" />

      <div className="shell relative z-10 grid gap-12 py-24 lg:h-screen lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-20 lg:py-0">
        {/* Vertical line diagram — the water's actual route through the plant. */}
        <ol className="hidden lg:block">
          {stages.map((stage, index) => (
            <li key={stage.key} className="relative flex items-center gap-5 py-3">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-pill transition-all duration-(--duration-base)',
                    index <= active ? 'scale-125 bg-aqua-400' : 'bg-white/25',
                  )}
                />
                {index < stages.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-1/2 h-[calc(100%+1.5rem)] w-px transition-colors duration-(--duration-base)',
                      index < active ? 'bg-aqua-400/70' : 'bg-white/12',
                    )}
                  />
                ) : null}
              </span>
              <span
                className={cn(
                  'text-sm transition-colors duration-(--duration-base)',
                  index === active ? 'text-white' : 'text-mist-500',
                )}
              >
                {stage.titleKey ? t(`${stage.titleKey}.title`) : stage.title}
              </span>
            </li>
          ))}
        </ol>

        <div className="relative lg:min-h-[26rem]">
          {stages.map((stage, index) => (
            <article
              key={stage.key}
              data-sequence-step
              className={cn(
                'border-t border-white/10 py-10 first:border-t-0 lg:absolute lg:inset-0 lg:border-0 lg:py-0',
                'lg:transition-[opacity,transform] lg:duration-(--duration-slow) lg:ease-[cubic-bezier(0.22,1,0.36,1)]',
                index === active
                  ? 'lg:translate-y-0 lg:opacity-100'
                  : 'lg:pointer-events-none lg:translate-y-8 lg:opacity-0',
              )}
            >
              <p className="font-display text-sm tracking-[0.3em] text-aqua-400 tabular">
                {String(index + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}
              </p>
              <h3 className="mt-5 font-display text-4xl leading-tight text-white lg:text-5xl">
                {stage.titleKey ? t(`${stage.titleKey}.title`) : stage.title}
              </h3>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist-300">
                {stage.titleKey ? t(`${stage.titleKey}.body`) : stage.body}
              </p>

              {stage.metrics.length > 0 ? (
                <dl className="mt-8 grid max-w-lg grid-cols-2 gap-6">
                  {stage.metrics.map((metric) => (
                    <div key={metric.labelKey}>
                      <dt className="text-xs uppercase tracking-[0.18em] text-mist-500">
                        {metrics(metric.labelKey)}
                      </dt>
                      <dd className="mt-1 text-base text-aqua-300 tabular">{metric.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
