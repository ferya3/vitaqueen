/**
 * Single source of truth for brand-level constants.
 * Anything that a marketing person may want to change lives in the CMS;
 * anything that the build itself depends on lives here.
 */
export const siteConfig = {
  name: 'VitaQueen',
  legalName: 'VitaQueen Natural Mineral Water Co.',
  domain: 'vitaqueen.com',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitaqueen.com',
  email: 'info@vitaqueen.com',
  exportEmail: 'export@vitaqueen.com',
  phone: '+98 21 0000 0000',
  address: {
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'IR',
  },
  /** Geographic position of the spring, used by the Source page and LocalBusiness schema. */
  spring: {
    latitude: 36.0,
    longitude: 51.4,
    altitudeMeters: 2140,
  },
  social: {
    instagram: '',
    linkedin: '',
    youtube: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
