'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/animations/gsap';
import { setLenis, getLenis } from '@/animations/lenis';
import { detectDeviceTier } from '@/hooks/useDeviceTier';

/**
 * Layer 2 of the architecture, bootstrapped once for the whole app.
 *
 *  1. Marks `<html>` as motion-capable, which is what allows the CSS to start
 *     hiding `[data-reveal]` elements. Before this runs, everything is visible.
 *  2. Publishes the device tier so CSS can drop the 3D and video layers.
 *  3. Starts Lenis and drives it from GSAP's ticker, so smooth scroll and
 *     ScrollTrigger share a single requestAnimationFrame loop.
 *
 * Smooth scroll is switched off entirely for reduced-motion users and low-tier
 * devices; the site then behaves like a normal, fast, native-scrolling page.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const tier = detectDeviceTier();
    root.dataset.tier = tier;
    root.classList.add('js-motion');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || tier === 'low') {
      ScrollTrigger.refresh();
      return () => {
        root.classList.remove('js-motion');
      };
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.4,
      autoRaf: false,
    });
    setLenis(lenis);

    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Fonts and hero media change layout after first paint; without this the
    // pinned sections end up measuring the wrong heights.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(onTick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      setLenis(null);
      root.classList.remove('js-motion');
    };
  }, []);

  // A client-side navigation leaves stale triggers behind and lands mid-page.
  useEffect(() => {
    const lenis = getLenis();
    lenis?.scrollTo(0, { immediate: true });
    if (!lenis) window.scrollTo(0, 0);
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
