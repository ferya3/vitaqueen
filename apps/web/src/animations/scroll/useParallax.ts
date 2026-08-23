'use client';

import { useRef } from 'react';
import { gsap } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

type Options = {
  /** Travel as a fraction of the element's height. 0.2 ≈ a restrained drift. */
  amount?: number;
  axis?: 'y' | 'x';
  /** `scrub: true` follows the scrollbar exactly; a number adds lag in seconds. */
  scrub?: number | boolean;
};

/** Depth-of-field drift for backgrounds and oversized imagery. */
export function useParallax<T extends HTMLElement = HTMLDivElement>({
  amount = 0.18,
  axis = 'y',
  scrub = 0.6,
}: Options = {}) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Parallax on a phone costs more than it communicates.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const context = gsap.context(() => {
      const distance = () =>
        (axis === 'y' ? element.offsetHeight : element.offsetWidth) * amount;

      gsap.fromTo(
        element,
        { [axis]: () => -distance() / 2 },
        {
          [axis]: () => distance() / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub,
            invalidateOnRefresh: true,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, [amount, axis, scrub]);

  return ref;
}
