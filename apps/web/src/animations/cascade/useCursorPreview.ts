'use client';

import { useCallback, useRef } from 'react';
import { gsap } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

type Options = {
  /** Gap between the cursor and the nearest corner of the preview, in pixels. */
  offset?: number;
};

/**
 * A framed preview that trails the cursor across an area.
 *
 * Two rules decide the shape of this hook. It never re-renders React — the
 * pointer moves far more often than sixty times a second and the preview is a
 * transform, not state. And it never overlaps what the reader is pointing at:
 * the frame is offset towards the inline-end edge and below, flipping side in
 * RTL, so the title under the cursor stays legible.
 *
 * Precise pointers only. A finger has no hover state to follow, and reduced
 * motion has no business being chased around the screen.
 */
export function useCursorPreview<
  A extends HTMLElement = HTMLElement,
  P extends HTMLElement = HTMLElement,
>({ offset = 28 }: Options = {}) {
  const areaRef = useRef<A>(null);
  const previewRef = useRef<P>(null);
  const controls = useRef<{ show: () => void; hide: () => void } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const area = areaRef.current;
    const preview = previewRef.current;
    if (!area || !preview) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const rtl = document.documentElement.dir === 'rtl';
    /** Do we know where the cursor is? A row can be entered without one move:
        scrolling slides the list under a stationary pointer and fires
        `pointerenter` all by itself. Showing the frame then would park it in the
        corner of the screen, which is worse than not showing it at all. */
    let placed = false;
    let wanted = false;

    /** Top-left corner for a given cursor position, on the trailing side. */
    const place = (event: PointerEvent) => ({
      x: rtl ? event.clientX - preview.offsetWidth - offset : event.clientX + offset,
      y: Math.min(
        event.clientY + offset,
        window.innerHeight - preview.offsetHeight - offset,
      ),
    });

    const context = gsap.context(() => {
      gsap.set(preview, { xPercent: 0, yPercent: 0, autoAlpha: 0, scale: 0.94 });

      const xTo = gsap.quickTo(preview, 'x', { duration: 0.55, ease: 'power3.out' });
      const yTo = gsap.quickTo(preview, 'y', { duration: 0.55, ease: 'power3.out' });

      const fadeIn = () =>
        gsap.to(preview, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          ease: 'power3.out',
          overwrite: true,
        });

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;
        const { x, y } = place(event);

        if (placed) {
          xTo(x);
          yTo(y);
          return;
        }

        // First position after a hide: arrive where the cursor already is
        // rather than flying across the section to catch up with it.
        gsap.set(preview, { x, y });
        placed = true;
        if (wanted) fadeIn();
      };

      area.addEventListener('pointermove', onMove, { passive: true });

      controls.current = {
        show: () => {
          wanted = true;
          if (placed) fadeIn();
        },
        hide: () => {
          wanted = false;
          placed = false;
          gsap.to(preview, {
            autoAlpha: 0,
            scale: 0.96,
            duration: 0.32,
            ease: 'power2.out',
            overwrite: true,
          });
        },
      };

      return () => {
        area.removeEventListener('pointermove', onMove);
        controls.current = null;
      };
    }, area);

    return () => context.revert();
  }, [offset]);

  const show = useCallback(() => controls.current?.show(), []);
  const hide = useCallback(() => controls.current?.hide(), []);

  return { areaRef, previewRef, show, hide };
}
