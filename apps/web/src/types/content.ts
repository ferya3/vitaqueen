/**
 * The contract between the Laravel CMS and the Next.js front end.
 *
 * These types mirror `App\Http\Resources\*` in `apps/api`. When a resource
 * changes shape on the backend, change it here in the same commit.
 */

export type LocalisedText = Record<string, string>;

export type MediaAsset = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Blur placeholder produced by the CMS on upload. */
  blurDataURL?: string;
};

export type VideoAsset = {
  /** Ordered by preference; the browser picks the first type it supports. */
  sources: Array<{ src: string; type: 'video/webm' | 'video/mp4' }>;
  poster: string;
};

export type MineralValue = {
  key: string;
  /** Message key under `source.minerals.*`, so the label is translated. */
  labelKey: string;
  value: number;
  unit: string;
  /** Regulatory limit, when one applies. Rendered next to the result. */
  limit?: number | null;
  method?: string | null;
};

export type WaterAnalysis = {
  id: number;
  /** Where the sample was drawn: wellhead, buffer tank, filler, finished good. */
  samplingPoint: string;
  sampledAt: string;
  laboratory: string | null;
  reportNumber: string | null;
  ph: number;
  tds: number;
  hardness: number | null;
  temperatureC: number | null;
  minerals: MineralValue[];
  documentUrl: string | null;
};

export type Certificate = {
  id: number;
  slug: string;
  title: string;
  issuer: string;
  number: string | null;
  scope: string | null;
  issuedAt: string | null;
  validUntil: string | null;
  logo: MediaAsset | null;
  documentUrl: string | null;
};

export type ProductSpec = {
  labelKey: string;
  value: string;
};

export type Product = {
  id: number;
  slug: string;
  sku: string;
  name: string;
  tagline: string | null;
  description: string;
  volumeMl: number;
  bottleType: string;
  capType: string;
  packaging: string;
  ph: number;
  tds: number;
  shelfLifeMonths: number;
  unitsPerCase: number | null;
  casesPerPallet: number | null;
  barcode: string | null;
  images: MediaAsset[];
  /** Optional glTF model. When absent the product page falls back to images. */
  model3dUrl: string | null;
  datasheetUrl: string | null;
  nutrition: Array<{ labelKey: string; value: string }>;
  specs: ProductSpec[];
  certificates: Certificate[];
  featured: boolean;
  order: number;
};

export type NewsArticle = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  /** Sanitised HTML from the CMS editor. */
  body: string;
  cover: string | null;
  publishedAt: string;
  updatedAt: string | null;
  tags: string[];
};

export type ProductionStage = {
  key: string;
  order: number;
  /** Message key under `factory.stages.*` when the stage is one of the standard eight. */
  titleKey?: string;
  title?: string;
  body?: string;
  media: MediaAsset | null;
  video: VideoAsset | null;
  metrics: Array<{ labelKey: string; value: string }>;
};

export type Distributor = {
  id: number;
  company: string;
  region: string;
  country: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
};

export type SourceProfile = {
  altitudeMeters: number;
  latitude: number;
  longitude: number;
  sourceType: string;
  aquiferAge: string;
  temperatureC: number;
  ph: number;
  tds: number;
  hardness: number;
  minerals: MineralValue[];
};

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic: string;
  subject: string;
  message: string;
  locale: string;
  /** Cloudflare Turnstile response token. */
  token?: string;
};
