'use client';

import { useRef } from 'react';
import { gsap } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

type Options = {
  /** Number of steps in the sequence. Drives the scroll distance. */
  steps: number;
  /** Called whenever the active step changes, including on scroll-back. */
  onStep?: (index: number) => void;
  /** Viewport heights of scroll distance allocated per step. */
  distancePerStep?: number;
  /** Disable pinning (mobile / reduced motion) and just report steps on enter. */
  enabled?: boolean;
};

/**
 * Pins a section and walks a scrubbed timeline through N discrete steps.
 *
 * This is the mechanism behind the home page "source → bottle" journey and the
 * factory process line: one pinned stage, many states, no page jump.
 */
export function usePinnedSequence<T extends HTMLElement = HTMLDivElement>({
  steps,
  onStep,
  distancePerStep = 0.9,
  enabled = true,
}: Options) {
  const containerRef = useRef<T>(null);
  const stepRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || steps < 1) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    // On a phone or with reduced motion, pinning a tall section traps the user.
    // Fall back to plain per-step triggers that fire as each panel scrolls by.
    if (!enabled || reduce || coarse) {
      const context = gsap.context(() => {
        container
          .querySelectorAll<HTMLElement>('[data-sequence-step]')
          .forEach((panel, index) => {
            gsap.to(panel, {
              scrollTrigger: {
                trigger: panel,
                start: 'top 65%',
                onEnter: () => onStep?.(index),
                onEnterBack: () => onStep?.(index),
              },
            });
          });
      }, container);
      return () => context.revert();
    }

    const context = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${window.innerHeight * distancePerStep * steps}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const next = Math.min(
              steps - 1,
              Math.floor(self.progress * steps * 0.999),
            );
            if (next !== stepRef.current) {
              stepRef.current = next;
              onStep?.(next);
            }
          },
        },
      });
    }, container);

    return () => context.revert();
  }, [steps, distancePerStep, enabled, onStep]);

  return containerRef;
}
