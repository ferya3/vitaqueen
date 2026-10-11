import { cn } from '@/lib/cn';

/**
 * The product, drawn.
 *
 * A clear PET bottle in vector: glass that picks up the colour behind it,
 * water with a lit meniscus, a wrap-around label, a ribbed cap, a specular
 * stripe and a contact shadow. It stands in for photography until the real
 * packshots exist, and it scales without a single extra request.
 *
 * Proportions follow the format: big formats are wider and squatter, the way
 * real bottles are, so a row of them reads as a range rather than as one
 * shape at five sizes.
 */
export function BottleArt({
  volumeMl = 1000,
  className,
  label = 'VITAQUEEN',
  tone = 'dark',
  idSuffix = '',
}: {
  volumeMl?: number;
  className?: string;
  label?: string;
  /** The ground the bottle sits on: tunes the glass edge and the shadow. */
  tone?: 'dark' | 'light';
  /** Disambiguates gradient ids when the same format appears twice on a page. */
  idSuffix?: string;
}) {
  const id = `vq${volumeMl}${tone}${idSuffix}`;

  // Width grows faster than height as the format gets bigger.
  const big = Math.min(1, Math.max(0, (Math.log10(volumeMl) - 2.5) / 1.2));
  const half = 36 + big * 16; // half body width
  const cx = 60;
  const left = cx - half;
  const right = cx + half;
  const shoulderY = 104 - big * 14;
  const neckHalf = 13 + big * 3;
  const volumeLabel = volumeMl >= 1000 ? `${volumeMl / 1000} L` : `${volumeMl} ML`;

  const body = `M${cx - neckHalf} 44 L${cx + neckHalf} 44
    C${cx + neckHalf} 64 ${right} ${shoulderY - 34} ${right} ${shoulderY}
    L${right} 286 Q${right} 304 ${right - 18} 304 L${left + 18} 304 Q${left} 304 ${left} 286
    L${left} ${shoulderY} C${left} ${shoulderY - 34} ${cx - neckHalf} 64 ${cx - neckHalf} 44 Z`;

  const edge = tone === 'dark' ? '#bff0fb' : '#0f4157';

  return (
    <svg viewBox="0 0 120 330" direction="ltr" className={cn("h-full w-auto overflow-visible", className)} role="img" aria-label={volumeLabel}>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity={tone === 'dark' ? 0.22 : 0.55} />
          <stop offset="0.18" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="0.75" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity={tone === 'dark' ? 0.28 : 0.6} />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7fe3f8" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#22c9e8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0888ac" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`${id}-depth`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#03131c" stopOpacity="0.35" />
          <stop offset="0.3" stopColor="#03131c" stopOpacity="0" />
          <stop offset="0.7" stopColor="#03131c" stopOpacity="0" />
          <stop offset="1" stopColor="#03131c" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${id}-label`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#dff7fd" />
          <stop offset="0.5" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9eef9" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#0a2f41" />
          <stop offset="0.45" stopColor="#1d6d8f" />
          <stop offset="1" stopColor="#061f2c" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={tone === 'dark' ? '#22c9e8' : '#0f2a3a'} stopOpacity={tone === 'dark' ? 0.45 : 0.28} />
          <stop offset="1" stopColor={tone === 'dark' ? '#22c9e8' : '#0f2a3a'} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={body} />
        </clipPath>
      </defs>

      {/* Contact shadow / glow */}
      <ellipse cx={cx} cy="312" rx={half + 16} ry="9" fill={`url(#${id}-shadow)`} />

      {/* Water, with its own darker core and a lit surface */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="0" y={shoulderY - 12} width="120" height="330" fill={`url(#${id}-water)`} />
        <rect x="0" y="0" width="120" height="330" fill={`url(#${id}-depth)`} />
        <ellipse cx={cx} cy={shoulderY - 12} rx={half} ry="3.2" fill="#e8fbff" opacity="0.7" />
        {/* Ribs: the moulded rings of a PET body */}
        {[0.62, 0.68, 0.74].map((f) => (
          <path
            key={f}
            d={`M${left} ${shoulderY + (286 - shoulderY) * f} Q${cx} ${shoulderY + (286 - shoulderY) * f + 5} ${right} ${shoulderY + (286 - shoulderY) * f}`}
            stroke="#ffffff"
            strokeOpacity="0.22"
            strokeWidth="1"
            fill="none"
          />
        ))}
        {/* Label */}
        <rect x="0" y={shoulderY + 34} width="120" height="62" fill={`url(#${id}-label)`} opacity="0.94" />
        <rect x="0" y={shoulderY + 34} width="120" height="2" fill="#22c9e8" />
        <rect x="0" y={shoulderY + 94} width="120" height="2" fill="#22c9e8" />
        <text
          x={cx}
          y={shoulderY + 60}
          textAnchor="middle"
          fontSize={9 + big * 3}
          fontWeight="700"
          letterSpacing="2.4"
          fill="#0a2f41"
          style={{ fontFamily: 'var(--font-latin), system-ui, sans-serif' }}
        >
          {label}
        </text>
        <text
          x={cx}
          y={shoulderY + 72}
          textAnchor="middle"
          fontSize={3.6 + big * 0.8}
          letterSpacing={0.6 + big * 0.4}
          fill="#0f4157"
          opacity="0.75"
          style={{ fontFamily: 'var(--font-latin), system-ui, sans-serif' }}
        >
          NATURAL MINERAL WATER
        </text>
        <text
          x={cx}
          y={shoulderY + 86}
          textAnchor="middle"
          fontSize="6.5"
          fontWeight="700"
          letterSpacing="1"
          fill="#0888ac"
          style={{ fontFamily: 'var(--font-latin), system-ui, sans-serif' }}
        >
          {volumeLabel}
        </text>
        {/* Glass tint over everything inside the body */}
        <rect x="0" y="0" width="120" height="330" fill={`url(#${id}-glass)`} />
        {/* Specular stripes */}
        <rect x={left + 7} y={shoulderY - 2} width="5" height={286 - shoulderY - 6} rx="2.5" fill="#ffffff" opacity="0.55" />
        <rect x={left + 15} y={shoulderY + 6} width="1.6" height={286 - shoulderY - 30} rx="0.8" fill="#ffffff" opacity="0.35" />
        <rect x={right - 9} y={shoulderY + 10} width="2.4" height={286 - shoulderY - 40} rx="1.2" fill="#ffffff" opacity="0.3" />
      </g>

      {/* Outline */}
      <path d={body} fill="none" stroke={edge} strokeOpacity={tone === 'dark' ? 0.55 : 0.35} strokeWidth="1.2" strokeLinejoin="round" />

      {/* Neck ring and ribbed cap */}
      <rect x={cx - neckHalf - 3} y="38" width={(neckHalf + 3) * 2} height="7" rx="2.5" fill={`url(#${id}-cap)`} />
      <rect x={cx - neckHalf - 1} y="10" width={(neckHalf + 1) * 2} height="29" rx="4" fill={`url(#${id}-cap)`} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x={cx - neckHalf + 2 + i * (((neckHalf - 1) * 2) / 7)}
          y="13"
          width="1.2"
          height="23"
          rx="0.6"
          fill="#ffffff"
          opacity="0.12"
        />
      ))}
      <rect x={cx - neckHalf + 1} y="12" width="3" height="25" rx="1.5" fill="#ffffff" opacity="0.28" />
    </svg>
  );
}
