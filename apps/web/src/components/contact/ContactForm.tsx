'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/Icons';
import { contactSchema } from '@/lib/contact-schema';
import { cn } from '@/lib/cn';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const TOPICS = ['general', 'sales', 'export', 'quality', 'career'] as const;

export function ContactForm({ defaultTopic = 'general' }: { defaultTopic?: string }) {
  const t = useTranslations('contact.form');
  const locale = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      company: String(form.get('company') ?? ''),
      topic: String(form.get('topic') ?? 'general'),
      subject: String(form.get('subject') ?? ''),
      message: String(form.get('message') ?? ''),
      website: String(form.get('website') ?? ''),
      consent: form.get('consent') === 'on',
      locale,
    };

    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      setStatus('idle');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      setStatus(response.ok ? 'sent' : 'error');
      if (response.ok) event.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <p className="glass rounded-xl border-mint-300/60 bg-mint-100/70 px-6 py-8 font-medium text-mint-700">
        {t('success')}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label={t('name')} required errors={errors.name} />
        <Field name="email" label={t('email')} type="email" required errors={errors.email} />
        <Field name="phone" label={t('phone')} type="tel" errors={errors.phone} />
        <Field name="company" label={t('company')} errors={errors.company} />
      </div>

      <label className="grid gap-2 text-sm">
        <span className="text-ink-500">{t('topic')}</span>
        <select
          name="topic"
          defaultValue={defaultTopic}
          className="h-12 rounded-lg border border-hairline bg-white/80 px-4 text-ink-900 outline-none transition-colors focus:border-aqua-500 focus:bg-white"
        >
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {t(`topics.${topic}`)}
            </option>
          ))}
        </select>
      </label>

      <Field name="subject" label={t('subject')} required errors={errors.subject} />

      <label className="grid gap-2 text-sm">
        <span className="text-ink-500">
          {t('message')} <span aria-hidden className="text-aqua-600">*</span>
        </span>
        <textarea
          name="message"
          rows={6}
          required
          minLength={20}
          className="rounded-lg border border-hairline bg-white/80 px-4 py-3 text-ink-900 outline-none transition-colors focus:border-aqua-500 focus:bg-white"
        />
        {errors.message ? <FieldError>{t('tooShort')}</FieldError> : null}
      </label>

      {/* Honeypot. Hidden from people, irresistible to form bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-500">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded-xs border-hairline accent-aqua-600"
        />
        <span>{t('consent')}</span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={status === 'sending'}>
          {status === 'sending' ? t('sending') : t('submit')}
          <ArrowIcon />
        </Button>
        {status === 'error' ? <FieldError>{t('failure')}</FieldError> : null}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required = false,
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-ink-500">
        {label} {required ? <span aria-hidden className="text-aqua-600">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoCompleteFor(name)}
        className={cn(
          'h-12 rounded-lg border bg-white/80 px-4 text-ink-900 outline-none transition-colors focus:border-aqua-500 focus:bg-white',
          errors ? 'border-red-400' : 'border-hairline',
        )}
      />
      {errors ? <FieldError>{errors[0]}</FieldError> : null}
    </label>
  );
}

function autoCompleteFor(name: string) {
  switch (name) {
    case 'name':
      return 'name';
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'company':
      return 'organization';
    default:
      return 'off';
  }
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span role="alert" className="text-xs text-red-600">
      {children}
    </span>
  );
}
