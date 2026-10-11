/**
 * Sample content.
 *
 * Written into the database the first time it is created (see
 * `src/server/seed.ts`), so a fresh install has a complete site to look at and
 * an admin panel with something in it. Two rules apply to what is allowed here:
 *
 *  1. **No invented certificates, news or distributors.** Those tables start
 *     empty. A certificate the factory does not hold is a legal problem later,
 *     not a nicer-looking page now.
 *  2. **Analysis figures are marked as sample data.** They are typical values
 *     for a hard bicarbonate mountain water, stored with `is_sample = 1`, and
 *     every page that shows them says so in the visitor's language until
 *     someone enters the laboratory's real numbers in the admin panel.
 */
import type { ProductionStage, SourceProfile, WaterAnalysis } from '@/types/content';
import type { Locale } from '@/i18n/routing';

type Localised<T> = Record<Locale, T>;

export const productCopy: Localised<Record<string, { name: string; tagline: string; description: string }>> = {
  en: {
    '330ml': {
      name: 'VitaQueen 330 ml',
      tagline: 'On the move',
      description: 'The single-serve format for hospitality, meetings and travel. Fits a hand, a cup holder and a conference table place setting.',
    },
    '500ml': {
      name: 'VitaQueen 500 ml',
      tagline: 'The everyday bottle',
      description: 'The most requested format in retail and food service, with a sports cap option for sale in transit and at events.',
    },
    '1l': {
      name: 'VitaQueen 1 L',
      tagline: 'Table service',
      description: 'Designed for restaurant tables and offices: enough for two settings, light enough to pour with one hand.',
    },
    '1-5l': {
      name: 'VitaQueen 1.5 L',
      tagline: 'The family bottle',
      description: 'The standard household format, with a shrink-wrapped six-pack that palletises efficiently for distribution.',
    },
    '5l': {
      name: 'VitaQueen 5 L',
      tagline: 'Home and office',
      description: 'Handled pack for home dispensers and office kitchens, produced on the same line and released under the same certificate of analysis.',
    },
  },
  fa: {
    '330ml': {
      name: 'ویتاکوئین ۳۳۰ میلی‌لیتر',
      tagline: 'همراه شما',
      description: 'حجم تک‌نفره برای هتل و رستوران، جلسات و سفر. اندازه‌ی دست، جای لیوان خودرو و میز جلسه.',
    },
    '500ml': {
      name: 'ویتاکوئین ۵۰۰ میلی‌لیتر',
      tagline: 'بطری هر روز',
      description: 'پرتقاضاترین حجم در خرده‌فروشی و خدمات غذایی، با گزینه‌ی درب اسپرت برای فروش در مسیر و رویدادها.',
    },
    '1l': {
      name: 'ویتاکوئین ۱ لیتری',
      tagline: 'سرویس میز',
      description: 'طراحی‌شده برای میز رستوران و دفتر کار: کافی برای دو نفر و سبک برای ریختن با یک دست.',
    },
    '1-5l': {
      name: 'ویتاکوئین ۱٫۵ لیتری',
      tagline: 'بطری خانواده',
      description: 'حجم استاندارد خانگی، با شرینک شش‌عددی که چیدمان بهینه‌ای روی پالت دارد.',
    },
    '5l': {
      name: 'ویتاکوئین ۵ لیتری',
      tagline: 'خانه و دفتر',
      description: 'بسته‌ی دسته‌دار برای آبسردکن خانگی و آشپزخانه‌ی اداری؛ روی همان خط تولید و با همان گواهی آنالیز ترخیص می‌شود.',
    },
  },
  ar: {
    '330ml': {
      name: 'فيتاكوين 330 مل',
      tagline: 'في الطريق',
      description: 'عبوة فردية للضيافة والاجتماعات والسفر. تناسب اليد وحامل الأكواب وطاولة الاجتماعات.',
    },
    '500ml': {
      name: 'فيتاكوين 500 مل',
      tagline: 'عبوة كل يوم',
      description: 'العبوة الأكثر طلباً في التجزئة وخدمات الأغذية، مع خيار غطاء رياضي للبيع أثناء التنقل وفي الفعاليات.',
    },
    '1l': { name: 'فيتاكوين 1 لتر', tagline: 'خدمة الطاولة', description: 'مصممة لطاولات المطاعم والمكاتب: تكفي شخصين وخفيفة بما يسمح بالسكب بيد واحدة.' },
    '1-5l': { name: 'فيتاكوين 1.5 لتر', tagline: 'عبوة العائلة', description: 'الحجم المنزلي القياسي، بعبوة سداسية مغلّفة حرارياً ترصف على المنصات بكفاءة.' },
    '5l': { name: 'فيتاكوين 5 لتر', tagline: 'المنزل والمكتب', description: 'عبوة بمقبض لمبردات المنزل ومطابخ المكاتب، تُنتج على الخط نفسه وتُفرج بشهادة التحليل نفسها.' },
  },
  ru: {
    '330ml': { name: 'VitaQueen 330 мл', tagline: 'В дорогу', description: 'Порционный формат для гостиниц, переговоров и поездок. Помещается в руку, подстаканник и сервировку переговорного стола.' },
    '500ml': { name: 'VitaQueen 500 мл', tagline: 'Бутылка на каждый день', description: 'Самый востребованный формат в рознице и общественном питании, с опцией спортивной крышки для продаж в пути и на мероприятиях.' },
    '1l': { name: 'VitaQueen 1 л', tagline: 'Для стола', description: 'Для ресторанных столов и офисов: хватает на две сервировки и достаточно лёгкая, чтобы налить одной рукой.' },
    '1-5l': { name: 'VitaQueen 1,5 л', tagline: 'Семейная бутылка', description: 'Стандартный домашний формат с термоусадочной упаковкой по шесть штук, эффективной при паллетировании.' },
    '5l': { name: 'VitaQueen 5 л', tagline: 'Дом и офис', description: 'Упаковка с ручкой для домашних диспенсеров и офисных кухонь; производится на той же линии и выпускается по тому же протоколу анализа.' },
  },
};

export const productFormats = [
  { slug: '330ml', volumeMl: 330, unitsPerCase: 24, casesPerPallet: 108, capType: 'PCO 1810, 26 mm', packaging: 'Shrink pack, 24 × 330 ml' },
  { slug: '500ml', volumeMl: 500, unitsPerCase: 12, casesPerPallet: 120, capType: 'PCO 1810, 26 mm', packaging: 'Shrink pack, 12 × 500 ml' },
  { slug: '1l', volumeMl: 1000, unitsPerCase: 12, casesPerPallet: 84, capType: 'PCO 1810, 30 mm', packaging: 'Shrink pack, 12 × 1 L' },
  { slug: '1-5l', volumeMl: 1500, unitsPerCase: 6, casesPerPallet: 96, capType: 'PCO 1810, 30 mm', packaging: 'Shrink pack, 6 × 1.5 L' },
  { slug: '5l', volumeMl: 5000, unitsPerCase: 2, casesPerPallet: 60, capType: 'Handle cap, 48 mm', packaging: 'Shrink pack, 2 × 5 L' },
] as const;

/** Typical mineral signature of a hard bicarbonate mountain water. Sample data. */
export const SAMPLE_MINERALS = [
  { key: 'calcium', labelKey: 'calcium', value: 62, unit: 'mg/L', limit: null, method: 'ISO 6058' },
  { key: 'magnesium', labelKey: 'magnesium', value: 26, unit: 'mg/L', limit: null, method: 'ISO 6059' },
  { key: 'sodium', labelKey: 'sodium', value: 9.4, unit: 'mg/L', limit: null, method: 'ISO 9964-3' },
  { key: 'potassium', labelKey: 'potassium', value: 1.8, unit: 'mg/L', limit: null, method: 'ISO 9964-3' },
  { key: 'bicarbonate', labelKey: 'bicarbonate', value: 288, unit: 'mg/L', limit: null, method: 'Titration' },
  { key: 'sulfate', labelKey: 'sulfate', value: 21, unit: 'mg/L', limit: 250, method: 'ISO 10304-1' },
  { key: 'chloride', labelKey: 'chloride', value: 7.5, unit: 'mg/L', limit: 250, method: 'ISO 10304-1' },
  { key: 'nitrate', labelKey: 'nitrate', value: 2.1, unit: 'mg/L', limit: 50, method: 'ISO 10304-1' },
  { key: 'silica', labelKey: 'silica', value: 11.6, unit: 'mg/L', limit: null, method: 'Spectrophotometry' },
  { key: 'fluoride', labelKey: 'fluoride', value: 0.14, unit: 'mg/L', limit: 1.5, method: 'ISO 10359-1' },
];

export const SAMPLE_PH = 7.4;
export const SAMPLE_TDS = 342;

export const sampleSourceText: Record<'sourceType' | 'aquiferAge', Localised<string>> = {
  sourceType: {
    fa: 'چشمه‌ی آرتزین',
    en: 'Artesian spring',
    ar: 'نبع ارتوازي',
    ru: 'Артезианский источник',
  },
  aquiferAge: {
    fa: 'بیش از ۴۰ سال',
    en: '40+ years',
    ar: 'أكثر من 40 عاماً',
    ru: 'Более 40 лет',
  },
};

/** Last-resort fallback when no source profile row exists at all. */
export function seedSourceProfile(locale: Locale): SourceProfile {
  return {
    altitudeMeters: 2140,
    latitude: 36.0,
    longitude: 51.4,
    sourceType: sampleSourceText.sourceType[locale],
    aquiferAge: sampleSourceText.aquiferAge[locale],
    temperatureC: 9.6,
    ph: SAMPLE_PH,
    tds: SAMPLE_TDS,
    hardness: 262,
    minerals: SAMPLE_MINERALS,
  };
}

/** Last-resort fallback when no analysis has been published. */
export function seedWaterAnalysis(): WaterAnalysis {
  return {
    id: 0,
    samplingPoint: 'Wellhead',
    sampledAt: new Date().toISOString(),
    laboratory: null,
    reportNumber: null,
    ph: SAMPLE_PH,
    tds: SAMPLE_TDS,
    hardness: 262,
    temperatureC: 9.6,
    minerals: SAMPLE_MINERALS,
    documentUrl: null,
  };
}

/** The eight standard stages. Copy comes from the message catalogue. */
export const STANDARD_STAGE_KEYS = [
  'waterSource',
  'rawWater',
  'treatment',
  'qualityControl',
  'bottling',
  'packaging',
  'warehouse',
  'distribution',
] as const;

/** Fallback when the stages table is empty. */
export function seedProductionStages(): ProductionStage[] {
  return STANDARD_STAGE_KEYS.map((key, index) => ({
    key,
    order: index,
    titleKey: key,
    media: null,
    video: null,
    metrics: [],
  }));
}
