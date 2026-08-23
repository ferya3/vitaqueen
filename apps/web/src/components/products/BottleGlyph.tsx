import { cn } from '@/lib/cn';

/**
 * Vector stand-in for the product photograph.
 *
 * The silhouette is derived from the actual volume, so the 330 ml and the 5 L
 * are visibly different objects and the range reads as a range — which a row
 * of identical placeholder rectangles would not.
 */
export function BottleGlyph({
  volumeMl,
  className,
  tone = 'light',
}: {
  volumeMl: number;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  // Height grows with the cube root of volume, the way a real bottle does.
  const scale = Math.cbrt(volumeMl / 500);
  const height = Math.min(100, 62 * scale);
  const width = Math.min(46, 22 * scale);
  const neck = width * 0.36;
  const shoulder = height * 0.2;
  const bodyTop = 118 - height;
  const fill = 118 - height * 0.94;

  const stroke = tone === 'light' ? '#0d2942' : '#d5f2fd';

  return (
    <svg
      viewBox="0 0 60 130"
      className={cn('h-full w-auto', className)}
      fill="none"
      role="img"
      aria-label={`${volumeMl} ml`}
    >
      <defs>
        <linearGradient id={`water-${volumeMl}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#79d7f7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0782ba" stopOpacity="0.95" />
        </linearGradient>
        <clipPath id={`clip-${volumeMl}`}>
          <path
            d={`M${30 - neck / 2} ${bodyTop - 12}
                h${neck}
                v6
                c0 ${shoulder * 0.45} ${width / 2 - neck / 2} ${shoulder * 0.3} ${width / 2 - neck / 2} ${shoulder}
                v${height - shoulder - 6}
                a4 4 0 0 1 -4 4
                h${-(width - 8)}
                a4 4 0 0 1 -4 -4
                v${-(height - shoulder - 6)}
                c0 ${-shoulder * 0.7} ${width / 2 - neck / 2} ${-shoulder * 0.55} ${width / 2 - neck / 2} ${-shoulder}
                z`}
          />
        </clipPath>
      </defs>

      {/* Water column */}
      <rect
        x="0"
        y={fill}
        width="60"
        height={130 - fill}
        fill={`url(#water-${volumeMl})`}
        clipPath={`url(#clip-${volumeMl})`}
      />

      {/* Glass outline */}
      <path
        d={`M${30 - neck / 2} ${bodyTop - 12}
            h${neck}
            v6
            c0 ${shoulder * 0.45} ${width / 2 - neck / 2} ${shoulder * 0.3} ${width / 2 - neck / 2} ${shoulder}
            v${height - shoulder - 6}
            a4 4 0 0 1 -4 4
            h${-(width - 8)}
            a4 4 0 0 1 -4 -4
            v${-(height - shoulder - 6)}
            c0 ${-shoulder * 0.7} ${width / 2 - neck / 2} ${-shoulder * 0.55} ${width / 2 - neck / 2} ${-shoulder}
            z`}
        stroke={stroke}
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity="0.75"
      />

      {/* Cap */}
      <rect
        x={30 - neck / 2 - 1.4}
        y={bodyTop - 19}
        width={neck + 2.8}
        height="7.5"
        rx="1.6"
        fill={stroke}
        opacity="0.9"
      />
    </svg>
  );
}
