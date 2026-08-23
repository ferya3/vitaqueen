'use client';

import { useLocale } from 'next-intl';
import { formatNumber } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/**
 * Horizontal bar for one mineral value.
 *
 * Bars are scaled against the highest value in the set rather than against an
 * absolute maximum — otherwise sodium at 8 mg/L renders as an invisible sliver
 * and the chart tells the reader nothing.
 */
export function MineralBar({
  label,
  value,
  unit,
  max,
  tone = 'default',
  className,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  tone?: 'default' | 'light';
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const percent = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className={cn('text-sm', tone === 'light' ? 'text-mist-200' : 'text-ink')}>{label}</span>
        <span className={cn('text-sm tabular', tone === 'light' ? 'text-aqua-300' : 'text-aqua-700')}>
          {formatNumber(value, locale)} <span className="text-xs opacity-70">{unit}</span>
        </span>
      </div>
      <div
        className={cn('h-1.5 w-full overflow-hidden rounded-pill', tone === 'light' ? 'bg-white/10' : 'bg-mist-300')}
        role="img"
        aria-label={`${label}: ${value} ${unit}`}
      >
        <div
          className="h-full rounded-pill bg-gradient-to-r from-aqua-600 to-aqua-300 transition-[width] duration-(--duration-cinematic) ease-[cubic-bezier(0.22,1,0.36,1)] rtl:bg-gradient-to-l"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
