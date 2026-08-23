/**
 * Route map for the whole site.
 *
 * `key` is the i18n message key under `nav.*`; `href` is the locale-less
 * pathname that `@/i18n/navigation` prefixes at render time. Keeping the tree
 * here means the header, the footer, the mobile menu and the sitemap all agree
 * on what the site actually contains.
 */
export type NavNode = {
  key: string;
  href: string;
  children?: NavNode[];
};

export const primaryNavigation: NavNode[] = [
  {
    key: 'about',
    href: '/about',
    children: [
      { key: 'aboutCompany', href: '/about#company' },
      { key: 'aboutHistory', href: '/about#history' },
      { key: 'aboutVision', href: '/about#vision' },
      { key: 'aboutManagement', href: '/about#management' },
    ],
  },
  {
    key: 'source',
    href: '/source',
    children: [
      { key: 'sourceSpring', href: '/source#spring' },
      { key: 'sourceGeography', href: '/source#geography' },
      { key: 'sourceCharacteristics', href: '/source#characteristics' },
      { key: 'sourceProtection', href: '/source#protection' },
    ],
  },
  {
    key: 'products',
    href: '/products',
    children: [
      { key: 'productsCategories', href: '/products#categories' },
      { key: 'productsPackaging', href: '/products#packaging' },
      { key: 'productsSpecifications', href: '/products#specifications' },
    ],
  },
  {
    key: 'factory',
    href: '/factory',
    children: [
      { key: 'factoryLine', href: '/factory#production-line' },
      { key: 'factoryFiltration', href: '/factory#filtration' },
      { key: 'factoryBottling', href: '/factory#bottling' },
      { key: 'factoryControl', href: '/factory#quality-control' },
      { key: 'factoryLaboratory', href: '/factory#laboratory' },
    ],
  },
  {
    key: 'quality',
    href: '/quality',
    children: [
      { key: 'qualityControl', href: '/quality#control' },
      { key: 'qualityLaboratory', href: '/quality#laboratory' },
      { key: 'qualityCertifications', href: '/quality#certifications' },
      { key: 'qualityAnalysis', href: '/quality#water-analysis' },
    ],
  },
  {
    key: 'sustainability',
    href: '/sustainability',
    children: [
      { key: 'sustainabilityEnvironment', href: '/sustainability#environment' },
      { key: 'sustainabilityEnergy', href: '/sustainability#energy' },
      { key: 'sustainabilityWater', href: '/sustainability#water-protection' },
      { key: 'sustainabilityRecycling', href: '/sustainability#recycling' },
    ],
  },
  { key: 'export', href: '/export' },
  { key: 'news', href: '/news' },
  { key: 'distributors', href: '/distributors' },
  { key: 'contact', href: '/contact' },
];

/** Routes that are always present regardless of CMS content — used by the sitemap. */
export const staticRoutes = [
  '/',
  '/about',
  '/source',
  '/products',
  '/factory',
  '/quality',
  '/sustainability',
  '/export',
  '/news',
  '/distributors',
  '/contact',
] as const;
