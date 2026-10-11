/**
 * The minerals an analysis can report. Each key is also a message key under
 * `source.minerals.*`, which is how the public site labels it in four
 * languages — so the admin panel offers exactly this list and nothing free-form.
 */
export const MINERALS = [
  { key: 'calcium', label: 'کلسیم', unit: 'mg/L' },
  { key: 'magnesium', label: 'منیزیم', unit: 'mg/L' },
  { key: 'sodium', label: 'سدیم', unit: 'mg/L' },
  { key: 'potassium', label: 'پتاسیم', unit: 'mg/L' },
  { key: 'bicarbonate', label: 'بی‌کربنات', unit: 'mg/L' },
  { key: 'sulfate', label: 'سولفات', unit: 'mg/L' },
  { key: 'chloride', label: 'کلراید', unit: 'mg/L' },
  { key: 'nitrate', label: 'نیترات', unit: 'mg/L' },
  { key: 'silica', label: 'سیلیس', unit: 'mg/L' },
  { key: 'fluoride', label: 'فلوراید', unit: 'mg/L' },
] as const;

/** The eight standard production stages and their Persian names. */
export const STAGE_LABELS: Record<string, string> = {
  waterSource: 'سرچشمه',
  rawWater: 'آب خام',
  treatment: 'تصفیه',
  qualityControl: 'کنترل کیفیت',
  bottling: 'بطری‌گیری',
  packaging: 'بسته‌بندی',
  warehouse: 'انبار',
  distribution: 'توزیع',
};
