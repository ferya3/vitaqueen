'use client';

import { useTranslations } from 'next-intl';
import { MineralBar } from '@/components/ui/MineralBar';
import { Reveal, RevealItem } from '@/components/motion/Reveal';
import type { MineralValue } from '@/types/content';
import { cn } from '@/lib/cn';

/**
 * The mineral signature, as bars.
 *
 * A table states the values; this makes the *shape* of the water legible at a
 * glance — which is the thing a buyer actually compares between brands.
 */
export function MineralChart({
  minerals,
  tone = 'default',
  className,
  columns = 2,
}: {
  minerals: MineralValue[];
  tone?: 'default' | 'light';
  className?: string;
  columns?: 1 | 2;
}) {
  const t = useTranslations('source.minerals');
  const max = Math.max(...minerals.map((mineral) => mineral.value), 1);

  return (
    <Reveal
      className={cn(
        'grid gap-x-12 gap-y-5',
        columns === 2 && 'sm:grid-cols-2',
        className,
      )}
      stagger={0.05}
    >
      {minerals.map((mineral) => (
        <RevealItem key={mineral.key}>
          <MineralBar
            label={t(mineral.labelKey)}
            value={mineral.value}
            unit={mineral.unit}
            max={max}
            tone={tone}
          />
        </RevealItem>
      ))}
    </Reveal>
  );
}
