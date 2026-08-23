import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { DownloadIcon } from '@/components/ui/Icons';
import { formatDate } from '@/lib/format';
import type { Certificate } from '@/types/content';
import type { Locale } from '@/i18n/routing';

/**
 * Certificates come from the CMS and nowhere else.
 *
 * There is no seeded fallback on purpose: a certificate the factory does not
 * hold is a compliance problem, not a design detail. With nothing published,
 * this renders the honest empty state.
 */
export async function CertificationGrid({
  certificates,
  locale,
}: {
  certificates: Certificate[];
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'quality' });
  const meta = await getTranslations({ locale, namespace: 'quality.certificateMeta' });

  if (certificates.length === 0) {
    return (
      <p className="max-w-lg rounded-lg border border-dashed border-line px-6 py-8 text-ink-muted">
        {t('empty')}
      </p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {certificates.map((certificate) => (
        <li key={certificate.id}>
          <Card className="flex h-full flex-col">
            <h3 className="font-display text-xl text-abyss-900">{certificate.title}</h3>
            <dl className="mt-5 grid gap-2.5 text-sm">
              <Row label={meta('issuer')} value={certificate.issuer} />
              {certificate.number ? <Row label={meta('number')} value={certificate.number} /> : null}
              {certificate.scope ? <Row label={meta('scope')} value={certificate.scope} /> : null}
              {certificate.validUntil ? (
                <Row label={meta('validUntil')} value={formatDate(certificate.validUntil, locale)} />
              ) : null}
            </dl>
            {certificate.documentUrl ? (
              <a
                href={certificate.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm text-aqua-700 transition-colors hover:text-aqua-500"
              >
                <DownloadIcon />
                {certificate.title}
              </a>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-end text-abyss-900">{value}</dd>
    </div>
  );
}
