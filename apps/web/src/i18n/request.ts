import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { defaultLocale, localeTags, routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = hasLocale(routing.locales, requested)
    ? requested
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Iran does not observe DST any more, but pinning the zone keeps news
    // datelines identical on the server and in the browser.
    timeZone: 'Asia/Tehran',
    formats: {
      dateTime: {
        short: { day: 'numeric', month: 'short', year: 'numeric' },
      },
      number: {
        precise: { maximumFractionDigits: 2 },
      },
    },
    onError(error) {
      // Missing messages must not blank a production page; surface them in dev.
      if (process.env.NODE_ENV !== 'production') console.error(error);
    },
    getMessageFallback({ key }) {
      return process.env.NODE_ENV === 'production' ? '' : `⟨${key}⟩`;
    },
  };
});

export { localeTags };
