'use client';

import { useRef } from 'react';
import { gsap } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

/**
 * Counts a number up when it scrolls into view.
 * The element must already contain the final value as text so that the figure
 * is correct for crawlers and for anyone with JavaScript disabled.
 */
export function useCountUp<T extends HTMLElement = HTMLSpanElement>(
  value: number,
  format: (value: number) => string,
) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      const counter = { value: 0 };
      gsap.to(counter, {
        value,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true },
        onUpdate: () => {
          element.textContent = format(counter.value);
        },
        onComplete: () => {
          element.textContent = format(value);
        },
      });
    }, element);

    return () => context.revert();
  }, [value, format]);

  return ref;
}
