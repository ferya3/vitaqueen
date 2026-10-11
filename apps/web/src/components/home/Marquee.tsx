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
export async function Marquee({ locale, facts }: { locale: Locale; facts: Array<{ label: string; value: string }> }) {
  const t = await getTranslations({ locale, namespace: 'home.marquee' });
  // A fact is a label and a value. The value (digits plus a Latin unit) is an
  // isolated left-to-right run, so Persian and Arabic readers see "2,140 m" and
  // not the unit thrown to the wrong side of the number.
  const fact = (index: number) => {
    const item = facts[index];
    return item ? (
      <>
        {item.label} <bdi dir="ltr">{item.value}</bdi>
      </>
    ) : null;
  };
  const items = [t('a'), fact(0), t('b'), fact(1), t('c'), fact(2), t('d')].filter(Boolean);

  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <li key={index} className="flex items-center whitespace-nowrap">
          <span className="px-5 font-display text-lg font-semibold text-heading sm:px-8 sm:text-2xl">
            {item}
          </span>
          <svg viewBox="0 0 24 28" aria-hidden className="h-4 w-auto shrink-0 text-aqua-500 sm:h-5">
            <path d="M12 1.5S22 12.2 22 18a10 10 0 1 1-20 0C2 12.2 12 1.5 12 1.5Z" fill="currentColor" />
          </svg>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee relative overflow-hidden border-y border-hairline bg-white/70 py-4 backdrop-blur sm:py-5">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-ground-100 to-transparent rtl:bg-gradient-to-l" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-ground-100 to-transparent rtl:bg-gradient-to-r" />
    </div>
  );
}
