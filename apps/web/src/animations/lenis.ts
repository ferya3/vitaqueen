'use client';

import Lenis from 'lenis';

let instance: Lenis | null = null;

export function setLenis(next: Lenis | null) {
  instance = next;
}

/** The app-wide smooth scroll controller, or `null` before hydration. */
export function getLenis() {
  return instance;
}

/**
 * Scroll to an element or offset. Falls back to native scrolling when Lenis is
 * not running (reduced motion, low-tier devices, SSR-rendered anchor clicks).
 */
export function scrollTo(
  target: string | HTMLElement | number,
  options?: { offset?: number; immediate?: boolean },
) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, {
      offset: options?.offset ?? 0,
      immediate: options?.immediate ?? false,
      duration: 1.1,
    });
    return;
  }

  if (typeof window === 'undefined') return;
  const element =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (typeof element === 'number') {
    window.scrollTo({ top: element, behavior: 'smooth' });
  } else if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
