import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { WaterBackdrop } from '@/components/ui/WaterBackdrop';
import { TextReveal } from '@/components/motion/TextReveal';
import type { Locale } from '@/i18n/routing';

export async function ClosingCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.cta' });

  return (
    <section className="relative overflow-hidden bg-abyss-950 text-mist-100">
      <WaterBackdrop variant="line" />
      <div aria-hidden className="absolute inset-0 bg-abyss-950/55" />
      <div className="shell relative z-10 flex flex-col items-start gap-8 py-28 sm:py-36">
        <TextReveal as="h2" className="max-w-2xl font-display text-5xl leading-[1.05] text-white">
          {t('title')}
        </TextReveal>
        <p className="max-w-xl text-lg leading-relaxed text-mist-300">{t('body')}</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact" variant="light" size="lg">
            {t('primary')}
            <ArrowIcon />
          </ButtonLink>
          <ButtonLink href="/export" variant="ghost" size="lg" className="text-mist-200 hover:text-white">
            {t('secondary')}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
