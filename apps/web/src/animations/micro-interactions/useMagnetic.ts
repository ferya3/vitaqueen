'use client';

import { useRef } from 'react';
import { gsap } from '@/animations/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

/** Buttons that lean toward the cursor. Pointer-precise devices only. */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.28) {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const move = gsap.quickTo(element, 'x', { duration: 0.5, ease: 'power3.out' });
    const lift = gsap.quickTo(element, 'y', { duration: 0.5, ease: 'power3.out' });

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      move((event.clientX - (rect.left + rect.width / 2)) * strength);
      lift((event.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      move(0);
      lift(0);
    };

    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    return () => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);

  return ref;
}
