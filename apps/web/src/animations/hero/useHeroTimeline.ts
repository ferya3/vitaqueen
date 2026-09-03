'use client';

import { useRef } from 'react';
import { gsap, SplitText } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { usePointer } from '@/hooks/usePointer';

/**
 * The hero's entrance and its pointer parallax.
 *
 * Everything is addressed through data attributes so that markup and motion can
 * change independently:
 *   [data-hero-line]      one line of the headline (split into words)
 *   [data-hero-sub]       supporting copy
 *   [data-hero-actions]   call-to-action row
 *   [data-hero-cue]       the scroll cue
 *   [data-hero-media]     background media, drifts slowest
 *   [data-hero-subject]   the bottle / product, drifts fastest
 */
export function useHeroTimeline<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const pointer = usePointer(0.06);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = root.querySelectorAll<HTMLElement>('[data-hero-line]');

    if (reduce) {
      gsap.set(root.querySelectorAll('[data-hero-line], [data-hero-sub], [data-hero-actions], [data-hero-cue]'), {
        opacity: 1,
        y: 0,
      });
      return;
    }

    const context = gsap.context(() => {
      // Words only. Splitting to characters would break Arabic-script
      // shaping in the Persian and Arabic headlines — see
      // `src/animations/splitting.ts`.
      const splits = Array.from(lines).map(
        (line) => new SplitText(line, { type: 'words', wordsClass: 'inline-block' }),
      );

      const timeline = gsap.timeline({
        defaults: { ease: 'expo.out' },
        // Wait for fonts: splitting before they load measures the fallback face.
        delay: 0.1,
      });

      timeline
        .from(root.querySelector('[data-hero-eyebrow]'), {
          opacity: 0,
          y: 16,
          duration: 0.8,
        })
        .from(
          splits.flatMap((split) => split.words),
          { opacity: 0, yPercent: 120, duration: 1.15, stagger: 0.045 },
          '-=0.5',
        )
        .from(
          root.querySelector('[data-hero-sub]'),
          { opacity: 0, y: 24, duration: 0.9 },
          '-=0.75',
        )
        .from(
          root.querySelector('[data-hero-actions]'),
          { opacity: 0, y: 20, duration: 0.7 },
          '-=0.65',
        )
        .from(
          root.querySelector('[data-hero-subject]'),
          { opacity: 0, scale: 1.08, duration: 1.6, ease: 'power2.out' },
          0.2,
        )
        .from(
          root.querySelector('[data-hero-cue]'),
          { opacity: 0, duration: 0.6 },
          '-=0.3',
        );

      // Scroll-out. The hero is no longer a full-viewport band pinned to the
      // top of the document, so it must not start fading the moment the page
      // loads: the trigger begins once the block's *bottom* enters the
      // viewport, and the media drifts rather than the copy disappearing.
      gsap.to(root.querySelector('[data-hero-media]'), {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      });

      // Pointer parallax, driven off GSAP's ticker so it shares one rAF loop.
      const media = root.querySelector<HTMLElement>('[data-hero-media]');
      const subject = root.querySelector<HTMLElement>('[data-hero-subject]');
      const setters = {
        mediaX: media ? gsap.quickSetter(media, 'x', 'px') : null,
        mediaY: media ? gsap.quickSetter(media, 'y', 'px') : null,
        subjectX: subject ? gsap.quickSetter(subject, 'x', 'px') : null,
        subjectY: subject ? gsap.quickSetter(subject, 'y', 'px') : null,
      };

      const onTick = () => {
        const { x, y } = pointer.current;
        setters.mediaX?.(x * -14);
        setters.mediaY?.(y * -10);
        setters.subjectX?.(x * 26);
        setters.subjectY?.(y * 18);
      };

      gsap.ticker.add(onTick);
      return () => gsap.ticker.remove(onTick);
    }, root);

    return () => context.revert();
  }, [pointer]);

  return ref;
}
