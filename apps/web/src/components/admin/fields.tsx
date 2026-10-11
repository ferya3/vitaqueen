'use client';

import type { ReactNode } from 'react';
import { Checkbox, FieldError, FieldHint, Input, Label, Select, Textarea } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import type { Translations } from '@/server/translations';
import { useFieldError } from './form-context';

const LOCALES = [
  { code: 'fa', label: 'فارسی', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
] as const;

type Base = {
  name: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
};

function Caption({ label, required }: { label: string; required?: boolean }) {
  return (
    <span>
      {label}
      {required ? <span className="ms-1 text-aqua-600">*</span> : null}
    </span>
  );
}

export function TextField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  type = 'text',
  dir,
  placeholder,
  inputMode,
  autoComplete,
  hideLabel,
}: Base & {
  /** Keeps the label for screen readers only, for inputs inside a table. */
  hideLabel?: boolean;
  defaultValue?: string | number | null;
  type?: string;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'email' | 'url' | 'tel';
  autoComplete?: string;
}) {
  const error = useFieldError(name);
  return (
    <Label className={className}>
      {hideLabel ? <span className="sr-only">{label}</span> : <Caption label={label} required={required} />}
      <Input
        name={name}
        type={type}
        dir={dir}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete ?? 'off'}
        aria-invalid={error ? true : undefined}
      />
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </Label>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  rows = 4,
  dir,
}: Base & { defaultValue?: string | null; rows?: number; dir?: 'ltr' | 'rtl' }) {
  const error = useFieldError(name);
  return (
    <Label className={className}>
      <Caption label={label} required={required} />
      <Textarea name={name} rows={rows} dir={dir} defaultValue={defaultValue ?? ''} aria-invalid={error ? true : undefined} />
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </Label>
  );
}

/**
 * One field in all four languages. Persian is the editor's working language,
 * so it comes first; an empty translation falls back to English, then
 * Persian, on the public site.
 */
export function LocalizedField({
  name,
  label,
  hint,
  required,
  className,
  values = {},
  multiline = false,
  rows = 4,
}: Base & { values?: Translations; multiline?: boolean; rows?: number }) {
  const error = useFieldError(name);
  return (
    <fieldset className={cn('grid gap-2 rounded-lg border border-hairline bg-ground-50/60 p-4', className)}>
      <legend className="px-1 text-sm font-medium text-ink-700">
        <Caption label={label} required={required} />
      </legend>
      <div className={cn('grid gap-3', multiline ? 'lg:grid-cols-2' : 'sm:grid-cols-2')}>
        {LOCALES.map((locale) => (
          <label key={locale.code} className="grid gap-1 text-xs text-ink-500">
            {locale.label}
            {multiline ? (
              <Textarea name={`${name}.${locale.code}`} dir={locale.dir} lang={locale.code} rows={rows} defaultValue={values[locale.code] ?? ''} />
            ) : (
              <Input name={`${name}.${locale.code}`} dir={locale.dir} lang={locale.code} defaultValue={values[locale.code] ?? ''} />
            )}
          </label>
        ))}
      </div>
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </fieldset>
  );
}

export function SelectField({
  name,
  label,
  hint,
  required,
  className,
  defaultValue,
  options,
}: Base & { defaultValue?: string; options: Array<{ value: string; label: string }> }) {
  const error = useFieldError(name);
  return (
    <Label className={className}>
      <Caption label={label} required={required} />
      <Select name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </Label>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
  disabled,
  className,
  value,
}: Omit<Base, 'required'> & { defaultChecked?: boolean; disabled?: boolean; value?: string }) {
  return (
    <label className={cn('flex items-start gap-2.5 text-sm text-ink-700', disabled && 'opacity-60', className)}>
      <Checkbox name={name} value={value} defaultChecked={defaultChecked} disabled={disabled} className="mt-0.5" />
      <span className="grid gap-0.5">
        {label}
        {hint ? <FieldHint>{hint}</FieldHint> : null}
      </span>
    </label>
  );
}

export function FileField({
  name,
  label,
  hint,
  className,
  accept,
  multiple,
  current,
  removeName,
}: Omit<Base, 'required'> & {
  accept: string;
  multiple?: boolean;
  /** What is attached now, with a link to view it. */
  current?: { url: string; label: string; image?: boolean } | null;
  /** Checkbox name that clears the current file on save. */
  removeName?: string;
}) {
  const error = useFieldError(name);
  return (
    <div className={cn('grid gap-2 text-sm font-medium text-ink-700', className)}>
      <span>{label}</span>
      {current ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-white px-3 py-2 text-xs font-normal">
          {current.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt="" className="size-12 rounded-md object-cover" />
          ) : null}
          <a href={current.url} target="_blank" rel="noreferrer" className="text-aqua-700 underline-offset-2 hover:underline">
            {current.label}
          </a>
          {removeName ? <CheckboxField name={removeName} label="حذف" className="ms-auto text-xs" /> : null}
        </div>
      ) : null}
      <input
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        className="block w-full text-xs font-normal text-ink-500 file:me-3 file:rounded-pill file:border-0 file:bg-aqua-500/12 file:px-4 file:py-2 file:text-sm file:font-medium file:text-aqua-800 hover:file:bg-aqua-500/20"
      />
      {error ? <FieldError>{error}</FieldError> : hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <header>
        <h2 className="text-base font-semibold text-heading">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
