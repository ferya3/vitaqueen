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
 *
 * The palettes are light. Everything in this system floats on a pale aurora,
 * so a dark backdrop would be a hole in the page rather than a surface.
 */
const palettes: Record<BackdropVariant, { from: string; via: string; to: string; ink: string }> = {
  spring: { from: '#f4fdff', via: '#c9f0fb', to: '#7fdcf2', ink: '#22c9e8' },
  depth: { from: '#f1fbff', via: '#cdeefb', to: '#8ed4ee', ink: '#08abcd' },
  mountain: { from: '#f5fdfa', via: '#d5f2e6', to: '#9fe4ca', ink: '#22b98c' },
  lab: { from: '#f3fcff', via: '#d9f1fb', to: '#a8e4f5', ink: '#0888ac' },
  line: { from: '#f2faff', via: '#dceff9', to: '#b6ddf0', ink: '#0d6d8b' },
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
          background: `radial-gradient(110% 85% at 18% 8%, ${palette.via} 0%, transparent 62%),
                       radial-gradient(85% 75% at 85% 18%, ${palette.to}88 0%, transparent 58%),
                       linear-gradient(160deg, ${palette.from} 12%, ${palette.via} 68%, ${palette.from} 100%)`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-60"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id={`wave-${variant}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={palette.ink} stopOpacity="0.4" />
            <stop offset="100%" stopColor={palette.ink} stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 9 }).map((_, index) => {
          const y = 120 + index * 74;
          return (
            <path
              key={index}
              d={`M-100 ${y} C 220 ${y - 58}, 420 ${y + 62}, 700 ${y - 12} S 1120 ${y + 48}, 1340 ${y - 26}`}
              stroke={`url(#wave-${variant})`}
              strokeWidth={index % 3 === 0 ? 1.6 : 0.8}
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
    </div>
  );
}
