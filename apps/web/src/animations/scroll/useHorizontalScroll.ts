'use client';

import { useRef } from 'react';
import { gsap } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

/**
 * Converts vertical scroll into a horizontal track (product formats, gallery).
 * In RTL the track travels the other way, which GSAP will not infer for us.
 */
export function useHorizontalScroll<
  T extends HTMLElement = HTMLDivElement,
  Track extends HTMLElement = HTMLDivElement,
>() {
  const sectionRef = useRef<T>(null);
  const trackRef = useRef<Track>(null);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.matchMedia('(max-width: 1023px)').matches;
    // Below the desktop breakpoint the track is a native swipe carousel.
    if (reduce || narrow) return;

    const rtl = document.documentElement.dir === 'rtl';

    const context = gsap.context(() => {
      const overflow = () => Math.max(0, track.scrollWidth - section.offsetWidth);

      gsap.to(track, {
        x: () => (rtl ? overflow() : -overflow()),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${overflow()}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => context.revert();
  }, []);

  return { sectionRef, trackRef };
}
