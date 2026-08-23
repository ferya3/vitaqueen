import { getTranslations } from 'next-intl/server';
import { DataTable } from '@/components/ui/DataTable';
import { formatNumber } from '@/lib/format';
import type { WaterAnalysis } from '@/types/content';
import type { Locale } from '@/i18n/routing';

/** The full wellhead analysis, rendered as a laboratory report would render it. */
export async function AnalysisTable({
  analysis,
  locale,
}: {
  analysis: WaterAnalysis;
  locale: Locale;
}) {
  const table = await getTranslations({ locale, namespace: 'quality.table' });
  const minerals = await getTranslations({ locale, namespace: 'source.minerals' });
  const facts = await getTranslations({ locale, namespace: 'source.facts' });

  const rows = [
    {
      parameter: facts('ph'),
      result: formatNumber(analysis.ph, locale),
      unit: '—',
      limit: '6.5 – 9.5',
      method: 'ISO 10523',
    },
    {
      parameter: facts('tds'),
      result: formatNumber(analysis.tds, locale),
      unit: 'mg/L',
      limit: '—',
      method: 'Gravimetric',
    },
    ...(analysis.hardness !== null
      ? [
          {
            parameter: facts('hardness'),
            result: formatNumber(analysis.hardness, locale),
            unit: 'mg/L CaCO₃',
            limit: '—',
            method: 'ISO 6059',
          },
        ]
      : []),
    ...analysis.minerals.map((mineral) => ({
      parameter: minerals(mineral.labelKey),
      result: formatNumber(mineral.value, locale),
      unit: mineral.unit,
      limit: mineral.limit != null ? formatNumber(mineral.limit, locale) : '—',
      method: mineral.method ?? '—',
    })),
  ];

  return (
    <DataTable
      columns={[
        { key: 'parameter', label: table('parameter') },
        { key: 'result', label: table('result'), numeric: true },
        { key: 'unit', label: table('unit') },
        { key: 'limit', label: table('limit'), numeric: true },
        { key: 'method', label: table('method') },
      ]}
      rows={rows}
    />
  );
}
