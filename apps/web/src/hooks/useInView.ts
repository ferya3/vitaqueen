'use client';

import { useEffect, useRef, useState } from 'react';

type Options = {
  /** Grow the viewport box so heavy media starts a beat before it is seen. */
  rootMargin?: string;
  threshold?: number;
};

/**
 * Is this element on screen?
 *
 * Deliberately a single boolean: it exists so a section can stop paying for
 * what nobody is looking at — a background video keeps decoding frames long
 * after it has scrolled away.
 *
 * It starts `true` and is corrected by the observer's first callback, which
 * arrives before the visitor could scroll anywhere. That way the server and the
 * client render the same thing, no state is written during an effect, and a
 * browser without `IntersectionObserver` degrades to "everything plays" rather
 * than to "nothing ever does".
 */
export function useInView<T extends HTMLElement = HTMLElement>({
  rootMargin = '200px',
  threshold = 0,
}: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return [ref, inView] as const;
}
