'use client';

import { useCallback } from 'react';
import { useCountUp } from '@/animations/micro-interactions/useCountUp';
import { useLocale } from 'next-intl';
import { formatNumber } from '@/lib/format';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/**
 * A single headline figure. The final value is rendered server-side and only
 * animated on the client, so the number is never wrong in a crawler's snapshot.
 */
export function Stat({
  value,
  label,
  suffix,
  className,
  tone = 'default',
}: {
  value: number;
  label: string;
  suffix?: string;
  className?: string;
  tone?: 'default' | 'light';
}) {
  const locale = useLocale() as Locale;
  const format = useCallback(
    (n: number) => formatNumber(Math.round(n), locale),
    [locale],
  );
  const ref = useCountUp<HTMLSpanElement>(value, format);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className={cn('font-display text-4xl tabular', tone === 'light' ? 'text-mist-50' : 'text-abyss-900')}>
        <span ref={ref}>{formatNumber(value, locale)}</span>
        {suffix ? <span className="text-2xl text-aqua-500">{suffix}</span> : null}
      </p>
      <p className={cn('text-sm', tone === 'light' ? 'text-mist-400' : 'text-ink-muted')}>{label}</p>
    </div>
  );
}
