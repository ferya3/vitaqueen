'use client';

import { useEffect, useRef } from 'react';

/**
 * Hairline reading-progress indicator under the header.
 * Written directly to the DOM on scroll — this must never trigger a render.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-ink-900/8">
      <div
        ref={ref}
        className="h-full origin-[left_center] bg-aqua-500 rtl:origin-[right_center]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
