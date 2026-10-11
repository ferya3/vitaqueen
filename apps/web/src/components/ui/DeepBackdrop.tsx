import { cn } from '@/lib/cn';

/**
 * Bubble field: fixed positions, sizes and timings, so the server render and
 * the client agree and two visits look the same.
 */
const BUBBLES = [
  { left: '8%', size: 6, duration: 14, delay: 0 },
  { left: '17%', size: 10, duration: 19, delay: 4 },
  { left: '29%', size: 4, duration: 12, delay: 7 },
  { left: '41%', size: 8, duration: 17, delay: 2 },
  { left: '56%', size: 5, duration: 13, delay: 9 },
  { left: '63%', size: 12, duration: 22, delay: 5 },
  { left: '74%', size: 6, duration: 15, delay: 11 },
  { left: '83%', size: 9, duration: 20, delay: 1 },
  { left: '92%', size: 4, duration: 11, delay: 6 },
];

/**
 * The deep-water ground behind every hero and dark band: layered gradients,
 * shafts of light, drifting caustics and a few rising bubbles.
 *
 * All CSS — no canvas, no image, no request — and all of it switches off for
 * reduced motion and on the low device tier (see `globals.css`). Place it as
 * the first child of a `relative overflow-hidden abyss` container.
 */
export function DeepBackdrop({
  className,
  bubbles = true,
  fade = false,
}: {
  className?: string;
  bubbles?: boolean;
  /** Fade the bottom edge into the light page below. */
  fade?: boolean;
}) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="light-rays" />
      <div className="caustics" />
      <div className="caustics is-slow" />
      {bubbles
        ? BUBBLES.map((bubble) => (
            <span
              key={bubble.left}
              className="bubble"
              style={{
                left: bubble.left,
                width: bubble.size,
                height: bubble.size,
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
              }}
            />
          ))
        : null}
      {/* A soft horizon so the type never sits on the brightest part of the glow. */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-abyss-950/70 to-transparent" />
      {fade ? <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ground-100 to-transparent" /> : null}
    </div>
  );
}
