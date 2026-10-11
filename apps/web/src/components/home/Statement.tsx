'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/animations/gsap';
import { Eyebrow } from '@/components/ui/Eyebrow';

/**
 * One sentence, set very large, whose words light up as it scrolls past.
 *
 * Split on spaces rather than by SplitText's character mode, so Persian and
 * Arabic words keep their joined letterforms. The full sentence is in the
 * markup at full strength; only once the script runs are the words dimmed and
 * then scrubbed back to full opacity by ScrollTrigger.
 */
export function Statement({ eyebrow, text }: { eyebrow: string; text: string }) {
  const ref = useRef<HTMLElement>(null);
  const sentence = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.fromTo(
        root.querySelectorAll('[data-word]'),
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: { trigger: sentence.current, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        },
      );
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <section ref={ref} className="shell section-y">
      <Eyebrow>{eyebrow}</Eyebrow>
      <p ref={sentence} className="display display-statement mt-6 max-w-4xl text-heading">
        {words.map((word, index) => (
          <span key={index} data-word className="inline">
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </section>
  );
}
