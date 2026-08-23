'use client';

import { useRef } from 'react';
import { gsap } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

type Options = {
  /** Long, slow scale drift on the background. Off for `low` tier devices. */
  drift?: boolean;
  start?: string;
};

/**
 * The entrance choreography for the cascade section, in one timeline.
 *
 * Seven beats, in the order the eye needs them: the background arrives, the
 * label draws in from the leading edge, the lead paragraph lifts, then the rows
 * come up one after another with their separator line drawing across and the
 * number resolving last. Nothing overlaps by accident — the offsets are what
 * make it read as one movement rather than six.
 *
 * The elements are found by data attribute rather than by ref so the markup can
 * be rearranged without rewriting the timeline, and they carry `data-reveal`,
 * so before this runs the CSS in `globals.css` is what hides them: if the
 * bundle never arrives, the section is simply visible.
 */
export function useCascadeEntrance<T extends HTMLElement = HTMLElement>({
  drift = true,
  start = 'top 72%',
}: Options = {}) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const query = <E extends HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<E>(selector));

    const reveal = (elements: Element[]) =>
      elements.forEach((element) => element.setAttribute('data-revealed', 'true'));

    const backdrop = query('[data-cascade-backdrop]');
    const label = query('[data-cascade-label]');
    const lead = query('[data-cascade-lead]');
    const rows = query('[data-cascade-row]');
    const lines = query('[data-cascade-line]');
    const numbers = query('[data-cascade-number]');
    const everything = [...backdrop, ...label, ...lead, ...rows, ...lines, ...numbers];

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      reveal(everything);
      return;
    }

    const rtl = document.documentElement.dir === 'rtl';

    const context = gsap.context(() => {
      gsap.set(lines, { transformOrigin: rtl ? 'right center' : 'left center' });

      const timeline = gsap.timeline({
        scrollTrigger: { trigger: root, start, once: true },
        // GSAP owns the values from here; the CSS fallback must stop hiding
        // them on the same frame the tween writes its first value.
        onStart: () => reveal(everything),
      });

      timeline
        .fromTo(
          backdrop,
          { opacity: 0, scale: 1.12 },
          { opacity: 1, scale: 1, duration: 1.5, ease: 'expo.out' },
        )
        .fromTo(
          label,
          { opacity: 0, x: rtl ? 28 : -28 },
          { opacity: 1, x: 0, duration: 0.8 },
          0.15,
        )
        .fromTo(lead, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9 }, 0.42)
        .fromTo(
          rows,
          { opacity: 0, y: 46 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.09 },
          0.5,
        )
        .fromTo(
          lines,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, stagger: 0.09, ease: 'expo.out' },
          0.5,
        )
        .fromTo(
          numbers,
          { opacity: 0 },
          { opacity: 1, duration: 0.7, stagger: 0.09 },
          0.72,
        );

      // A visitor can arrive with the section already on screen: the hero's
      // own "#journey" link, a restored scroll position, a deep link. A
      // `fromTo` writes its start values the moment it is built, so if the
      // trigger is then re-evaluated by a refresh instead of firing — which is
      // exactly what the font-load and route-change refreshes in
      // `MotionProvider` do — the section is left holding an invisible first
      // frame. Playing it outright when it is already in view closes that
      // window; the trigger is `once`, so nothing plays twice.
      if (root.getBoundingClientRect().top < window.innerHeight * 0.72) {
        timeline.play();
      }
    }, root);

    return () => context.revert();
  }, [start]);

  // The endless drift is a separate context: it starts once, survives the
  // entrance, and is suspended whenever the section is off screen.
  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root || !drift) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        '[data-cascade-drift]',
        { scale: 1.02 },
        {
          scale: 1.08,
          duration: 26,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            toggleActions: 'play pause resume pause',
          },
        },
      );
    }, root);

    return () => context.revert();
  }, [drift]);

  return ref;
}
