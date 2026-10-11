'use client';

import { useRef } from 'react';
import { gsap, SplitText } from '@/animations/gsap';
import { useGSAP } from '@gsap/react';
import { resolveSplitType } from '@/animations/splitting';
import { cn } from '@/lib/cn';

type TextRevealProps = {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  className?: string;
  /** `lines` reads as editorial, `words` as energetic, `chars` as a logotype. */
  split?: 'lines' | 'words' | 'chars';
  delay?: number;
  start?: string;
};

/**
 * Masked type reveal.
 *
 * The original text stays in the DOM as a single string until the client splits
 * it, so screen readers and crawlers never meet a pile of one-letter elements.
 */
export function TextReveal({
  children,
  as: Tag = 'h2',
  className,
  split = 'lines',
  delay = 0,
  start = 'top 84%',
}: TextRevealProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const element = ref.current;
      if (!element) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let instance: SplitText | null = null;
      let cancelled = false;

      const run = () => {
        if (cancelled) return;
        // Arabic and Persian downgrade `chars` to `words` so glyph joining
        // survives the split — see `src/animations/splitting.ts`.
        const granularity = resolveSplitType(split, element);

        instance = new SplitText(element, {
          type: granularity,
          linesClass: 'overflow-hidden [&>*]:inline-block',
        });

        const targets =
          granularity === 'lines' ? instance.lines : granularity === 'words' ? instance.words : instance.chars;

        gsap.from(targets, {
          yPercent: 118,
          opacity: 0,
          duration: 1.1,
          delay,
          ease: 'expo.out',
          stagger: granularity === 'chars' ? 0.02 : 0.08,
          scrollTrigger: { trigger: element, start, once: true },
        });
      };

      // Splitting before webfonts settle measures the fallback metrics and the
      // lines re-wrap mid-animation. The deferred run is wrapped with
      // `contextSafe` so its tweens are still reverted on unmount.
      if (document.fonts?.status === 'loaded') run();
      else {
        const deferred = contextSafe ? contextSafe(run) : run;
        document.fonts?.ready.then(deferred).catch(deferred);
      }

      return () => {
        cancelled = true;
        instance?.revert();
      };
    },
    { scope: ref, dependencies: [children, split, delay, start] },
  );

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
