'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/**
 * Counts a number up when it scrolls into view, with Framer Motion's `animate`.
 *
 * The element must already contain the final value as text so that the figure
 * is correct for crawlers and for anyone with JavaScript disabled; the count
 * only starts once the element is actually on screen.
 */
export function useCountUp<T extends HTMLElement = HTMLSpanElement>(
  value: number,
  format: (value: number) => string,
) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' });
  const reduce = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || !inView || reduce) return;

    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        element.textContent = format(latest);
      },
      onComplete: () => {
        element.textContent = format(value);
      },
    });

    return () => controls.stop();
  }, [inView, reduce, value, format]);

  return ref;
}
