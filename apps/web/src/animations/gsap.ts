'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';

/**
 * Single registration point for GSAP.
 *
 * Importing plugins from anywhere else risks registering them twice (harmless)
 * or forgetting to register them at all (not harmless). Every animation module
 * in `src/animations` imports `gsap` from here.
 */
let registered = false;

if (typeof window !== 'undefined' && !registered) {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });
  // The design system's curves, available to timelines by name.
  gsap.config({ nullTargetWarn: false });
  registered = true;
}

export { gsap, ScrollTrigger, ScrollToPlugin, SplitText };

/** Durations and eases mirrored from the CSS motion tokens. */
export const motionTokens = {
  duration: { fast: 0.22, base: 0.42, slow: 0.76, cinematic: 1.2 },
  ease: {
    water: 'power3.out',
    drop: 'expo.out',
    swell: 'power2.inOut',
  },
} as const;
