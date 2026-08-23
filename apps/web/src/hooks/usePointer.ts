'use client';

import { useEffect, useRef } from 'react';

export type PointerState = { x: number; y: number };

/**
 * Normalised pointer position in the range [-1, 1] with inertia.
 *
 * Returns a ref rather than state on purpose: the hero parallax reads this on
 * every animation frame, and re-rendering React 60 times a second to move a
 * bottle by 12 pixels would be an expensive way to do nothing.
 */
export function usePointer(smoothing = 0.08) {
  const target = useRef<PointerState>({ x: 0, y: 0 });
  const current = useRef<PointerState>({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const onMove = (event: PointerEvent) => {
      target.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };

    let frame = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * smoothing;
      current.current.y += (target.current.y - current.current.y) * smoothing;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [smoothing]);

  return current;
}
