'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

export type RevealDirection = 'up' | 'down' | 'start' | 'scale' | 'fade';

type Options = {
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  /** Stagger applied to `[data-reveal-item]` children, in seconds. */
  stagger?: number;
  start?: string;
  once?: boolean;
};

/**
 * The workhorse of the scroll layer.
 *
 * Rather than animating inline styles, it flips `data-revealed` and lets the
 * CSS in `globals.css` do the transition when GSAP is unavailable — so a failed
 * chunk load degrades to "content is simply visible" instead of a blank page.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  direction = 'up',
  delay = 0,
  duration = 0.9,
  stagger = 0.08,
  start = 'top 82%',
  once = true,
}: Options = {}) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      element.setAttribute('data-revealed', 'true');
      element
        .querySelectorAll('[data-reveal-item]')
        .forEach((item) => item.setAttribute('data-revealed', 'true'));
      return;
    }

    const items = element.querySelectorAll<HTMLElement>('[data-reveal-item]');
    const targets = items.length > 0 ? Array.from(items) : [element];
    const rtl = document.documentElement.dir === 'rtl';

    const from: gsap.TweenVars = { opacity: 0 };
    if (direction === 'up') from.y = 40;
    if (direction === 'down') from.y = -40;
    if (direction === 'start') from.x = rtl ? 40 : -40;
    if (direction === 'scale') from.scale = 1.06;

    const context = gsap.context(() => {
      gsap.fromTo(targets, from, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start,
          once,
          onEnter: () => {
            element.setAttribute('data-revealed', 'true');
            targets.forEach((t) => t.setAttribute('data-revealed', 'true'));
          },
        },
      });
    }, element);

    return () => context.revert();
  }, [direction, delay, duration, stagger, start, once]);

  return ref;
}

/** Refreshes ScrollTrigger after async content (images, fonts) changes layout. */
export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}
