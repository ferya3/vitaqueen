'use client';

import { useSyncExternalStore } from 'react';

export type DeviceTier = 'low' | 'medium' | 'high';

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

/**
 * Decides how much motion this device can afford.
 *
 *   high   → 3D scene + full GSAP timelines
 *   medium → video background + scroll animation
 *   low    → static poster, transitions only
 *
 * The tier is mirrored onto `<html data-tier>` by MotionProvider so that CSS
 * can drop heavy layers without waiting for React to re-render.
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'medium';

  const nav = navigator as NavigatorWithHints;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
  if (nav.connection?.saveData) return 'low';
  if (['slow-2g', '2g'].includes(nav.connection?.effectiveType ?? '')) return 'low';
  if (!supportsWebGL()) return 'medium';

  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  if (memory <= 2 || cores <= 2) return 'low';
  // A phone can have eight cores and still throttle a full-screen 3D canvas
  // into a slideshow, so touch devices cap out at `medium`.
  if (coarse) return 'medium';
  if (memory >= 8 && cores >= 8) return 'high';
  return 'medium';
}

/**
 * The tier is measured once per page load and then cached.
 *
 * `getSnapshot` must be stable or `useSyncExternalStore` loops forever, and
 * re-probing WebGL support on every render would be wasteful anyway. Nothing
 * here changes without a reload except `prefers-reduced-motion`, and that
 * already has its own subscription in `useMediaQuery`.
 */
let cachedTier: DeviceTier | null = null;

function getTierSnapshot(): DeviceTier {
  cachedTier ??= detectDeviceTier();
  return cachedTier;
}

/** Nothing to subscribe to: the tier is fixed for the life of the document. */
const noopSubscribe = () => () => {};

/** SSR renders the middle tier: never the heaviest, never the most degraded. */
const getServerTier = (): DeviceTier => 'medium';

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(noopSubscribe, getTierSnapshot, getServerTier);
}
