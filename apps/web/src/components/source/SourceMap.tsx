'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

/**
 * Schematic of the water's route: catchment → spring → closed line → plant.
 *
 * Deliberately a diagram rather than an embedded map. A third-party map tile
 * provider would mean an external script, a cookie banner and a CSP exception,
 * and it would still not show the one thing that matters here — that nothing
 * sits above the collection point.
 */
export function SourceMap({
  altitude,
  className,
}: {
  altitude: string;
  className?: string;
}) {
  const t = useTranslations('source.map');

  return (
    <figure className={cn('relative overflow-hidden rounded-lg bg-abyss-950', className)}>
      <svg viewBox="0 0 900 520" className="h-full w-full" role="img" aria-label={t('title')}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b2e45" />
            <stop offset="100%" stopColor="#030d18" />
          </linearGradient>
          <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a4a39" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#051424" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#79d7f7" />
            <stop offset="100%" stopColor="#0782ba" />
          </linearGradient>
        </defs>

        <rect width="900" height="520" fill="url(#sky)" />

        {/* Far ridge */}
        <path d="M0 300 L120 210 L210 268 L320 150 L430 250 L520 196 L640 286 L760 208 L900 300 V520 H0 Z" fill="url(#ridge)" opacity="0.55" />
        {/* Near ridge, carrying the spring */}
        <path d="M0 360 L150 268 L260 330 L380 224 L500 316 L620 252 L760 330 L900 268 V520 H0 Z" fill="url(#ridge)" />

        {/* Snow line marks the catchment */}
        <path d="M330 262 L380 224 L432 262 L400 250 L366 258 Z" fill="#d5f2fd" opacity="0.8" />

        {/* Water route */}
        <path
          d="M380 236 C 396 300, 470 320, 520 356 S 640 404, 726 404"
          stroke="url(#flow)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="6 10"
        >
          <animate attributeName="stroke-dashoffset" from="64" to="0" dur="3.2s" repeatCount="indefinite" />
        </path>

        {/* Spring marker */}
        <circle cx="380" cy="230" r="7" fill="#79d7f7" />
        <circle cx="380" cy="230" r="16" fill="none" stroke="#79d7f7" strokeOpacity="0.5">
          <animate attributeName="r" values="10;26;10" dur="3.6s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="3.6s" repeatCount="indefinite" />
        </circle>

        {/* Plant */}
        <g transform="translate(700 372)">
          <rect x="0" y="0" width="72" height="34" rx="3" fill="#0d2942" stroke="#3abdee" strokeOpacity="0.5" />
          <rect x="10" y="-14" width="10" height="16" fill="#0d2942" stroke="#3abdee" strokeOpacity="0.5" />
        </g>

        <g fontSize="13" fill="#b0e7fb" fontFamily="inherit">
          <text x="380" y="204" textAnchor="middle">{t('sourcePoint')}</text>
          <text x="380" y="188" textAnchor="middle" fill="#6b7d8a" fontSize="11" direction="ltr">
            {altitude}
          </text>
          <text x="736" y="428" textAnchor="middle">{t('plant')}</text>
          <text x="120" y="182" fill="#4d5c67" fontSize="11">{t('mountains')}</text>
          <text x="540" y="348" fill="#4d5c67" fontSize="11">{t('journey')}</text>
        </g>
      </svg>
      <figcaption className="sr-only">{t('title')}</figcaption>
    </figure>
  );
}
