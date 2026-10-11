'use client';

import { useActionState, useTransition, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { initialFormState, type FormState } from '@/lib/form-state';
import { cn } from '@/lib/cn';
import { FormErrorsContext } from './form-context';

type Action = (state: FormState, data: FormData) => Promise<FormState>;

/**
 * Every admin form: a Server Action, a pending state, and the result.
 *
 * Submitted through `onSubmit` rather than `<form action>`, because React
 * resets a form after an action passed that way finishes — which, after a
 * validation error, would throw away everything the editor just typed and any
 * file they had chosen.
 */
export function AdminForm({
  action,
  children,
  submitLabel = 'ذخیره',
  className,
  confirm,
  footer,
}: {
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  /** Asks before submitting, for anything destructive. */
  confirm?: string;
  footer?: ReactNode;
}) {
  const [state, dispatch] = useActionState(action, initialFormState);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  return (
    <FormErrorsContext value={state.fieldErrors ?? {}}>
      <form onSubmit={onSubmit} className={cn('grid gap-6', className)} noValidate>
        <FormStatus state={state} />
        {children}
        <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
          {footer}
        </div>
      </form>
    </FormErrorsContext>
  );
}

export function FormStatus({ state }: { state: FormState }) {
  return (
    <>
      {state.error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-mint-300 bg-mint-100 px-4 py-3 text-sm text-mint-700">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      ) : null}
      {state.reveal ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-4" />
            {state.reveal.label}
          </p>
          <ul dir="ltr" className="mt-3 grid gap-1.5 font-mono text-base sm:grid-cols-2">
            {state.reveal.values.map((value) => (
              <li key={value} className="select-all rounded-md bg-white px-3 py-1.5 text-start">
                {value}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
