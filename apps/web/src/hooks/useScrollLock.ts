'use client';

import { useEffect } from 'react';
import { getLenis } from '@/animations/lenis';

/** Freezes both native and Lenis scrolling while a modal or menu is open. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const lenis = getLenis();
    const previous = document.body.style.overflow;

    lenis?.stop();
    document.body.style.overflow = 'hidden';

    return () => {
      lenis?.start();
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
