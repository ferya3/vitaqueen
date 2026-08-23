import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/hero/PageHero';
import { Section } from '@/components/ui/Section';
import { ButtonLink } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <>
      <PageHero eyebrow="404" title={t('notFoundTitle')} lead={t('notFoundBody')} backdrop="depth" />
      <Section tone="canvas">
        <ButtonLink href="/">
          {t('backHome')}
          <ArrowIcon />
        </ButtonLink>
      </Section>
    </>
  );
}
