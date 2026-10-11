import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';

/**
 * A slow ticker of what the water is, between the hero and the range.
 *
 * Two copies of the row sit in one track; the track moves by exactly half its
 * width and starts over on an identical frame. Pure CSS, paused on hover,
 * still under reduced motion, and the copy is hidden from assistive tech so
 * the phrases are read once rather than in a loop.
 */
export async function Marquee({ locale, facts }: { locale: Locale; facts: string[] }) {
  const t = await getTranslations({ locale, namespace: 'home.marquee' });
  const items = [t('a'), facts[0], t('b'), facts[1], t('c'), facts[2], t('d')].filter(Boolean);

  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <li key={index} className="flex items-center whitespace-nowrap">
          <span className="px-6 font-display text-2xl font-semibold tracking-tight text-heading sm:px-10 sm:text-4xl">
            {item}
          </span>
          <svg viewBox="0 0 24 28" aria-hidden className="h-5 w-auto shrink-0 text-aqua-500 sm:h-7">
            <path d="M12 1.5S22 12.2 22 18a10 10 0 1 1-20 0C2 12.2 12 1.5 12 1.5Z" fill="currentColor" />
          </svg>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee relative overflow-hidden border-y border-hairline bg-white/70 py-6 backdrop-blur sm:py-8">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-ground-100 to-transparent rtl:bg-gradient-to-l" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-ground-100 to-transparent rtl:bg-gradient-to-r" />
    </div>
  );
}
