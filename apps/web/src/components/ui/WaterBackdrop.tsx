import { cn } from '@/lib/cn';

export type BackdropVariant = 'spring' | 'depth' | 'mountain' | 'lab' | 'line';

/**
 * Generated background art.
 *
 * The brand photography for a real factory does not exist until someone flies
 * a camera to the spring, and a stock photo of "generic mountain water" is
 * worse than no photo at all. These are deterministic gradients plus a wave
 * field: they carry the palette, they weigh a couple of kilobytes, and they
 * are replaced by `MediaLayer` the moment a real asset is configured.
 */
const palettes: Record<BackdropVariant, { from: string; via: string; to: string }> = {
  spring: { from: '#062033', via: '#0a4d6e', to: '#14a2dc' },
  depth: { from: '#030d18', via: '#08243c', to: '#0a6796' },
  mountain: { from: '#051424', via: '#123f52', to: '#35906b' },
  lab: { from: '#04121f', via: '#0d2942', to: '#3abdee' },
  line: { from: '#030d18', via: '#10567b', to: '#124867' },
};

export function WaterBackdrop({
  variant = 'depth',
  className,
  animated = true,
}: {
  variant?: BackdropVariant;
  className?: string;
  animated?: boolean;
}) {
  const palette = palettes[variant];

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 20% 10%, ${palette.via} 0%, transparent 60%),
                       radial-gradient(90% 80% at 85% 20%, ${palette.to}55 0%, transparent 55%),
                       linear-gradient(160deg, ${palette.from} 10%, ${palette.via} 65%, ${palette.from} 100%)`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-45"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id={`wave-${variant}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.to} stopOpacity="0.55" />
            <stop offset="100%" stopColor={palette.to} stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 9 }).map((_, index) => {
          const y = 120 + index * 74;
          return (
            <path
              key={index}
              d={`M-100 ${y} C 220 ${y - 58}, 420 ${y + 62}, 700 ${y - 12} S 1120 ${y + 48}, 1340 ${y - 26}`}
              stroke={`url(#wave-${variant})`}
              strokeWidth={index % 3 === 0 ? 1.4 : 0.7}
              fill="none"
            >
              {animated ? (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 40 -10; 0 0"
                  dur={`${16 + index * 2}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </path>
          );
        })}
      </svg>
      {/* Fine grain stops the gradients from banding on wide gamut displays. */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
