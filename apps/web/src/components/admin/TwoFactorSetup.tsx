'use client';

import Link from 'next/link';
import { useActionState, useTransition, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Field';
import { confirmTwoFactorSetup } from '@/server/actions/auth';
import { initialFormState } from '@/lib/form-state';
import { FormStatus } from './AdminForm';

/**
 * Enrolment, then the recovery codes.
 *
 * Confirming rotates the session cookie, and a cookie change makes Next
 * re-render this page on the server — now for a user who already has 2FA.
 * This component stays mounted through that re-render (the page renders it
 * in both states), so the codes held in its action state are still on screen.
 */
export function TwoFactorSetup({ enabled, secret, uri }: { enabled: boolean; secret: string | null; uri: string | null }) {
  const [state, dispatch] = useActionState(confirmTwoFactorSetup, initialFormState);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }

  if (state.reveal || enabled) {
    return (
      <div className="grid gap-5">
        <FormStatus state={state} />
        {!state.reveal ? <p className="text-sm text-ink-600">تأیید دومرحله‌ای برای این حساب فعال است.</p> : null}
        {state.reveal ? (
          <p className="text-sm leading-relaxed text-ink-600">
            این کدها را جایی امن (مثلاً مدیر رمز عبور) نگه دارید. اگر گوشی از دست برود، هر کد یک بار به‌جای کد برنامه کار می‌کند.
          </p>
        ) : null}
        <Link href="/admin" className="font-semibold text-aqua-700 hover:underline">
          ادامه به پنل ←
        </Link>
      </div>
    );
  }

  const grouped = secret?.match(/.{1,4}/g)?.join(' ') ?? '';

  return (
    <div className="grid gap-6">
      <ol className="grid list-decimal gap-4 ps-5 text-sm leading-relaxed text-ink-600">
        <li>یک برنامه‌ی احراز هویت نصب کنید (Google Authenticator، Microsoft Authenticator، Aegis یا 1Password).</li>
        <li>
          روی گوشی،{' '}
          <a href={uri ?? '#'} className="font-medium text-aqua-700 underline underline-offset-2">
            این پیوند را لمس کنید
          </a>{' '}
          تا حساب به برنامه اضافه شود؛ یا در برنامه «افزودن با کلید» را بزنید و این کلید را وارد کنید:
          <code dir="ltr" className="mt-2 block select-all rounded-lg bg-ink-900 px-3 py-2 text-center font-mono text-base tracking-wider text-ground-50">
            {grouped}
          </code>
        </li>
        <li>کد شش‌رقمی‌ای که برنامه نشان می‌دهد را وارد کنید.</li>
      </ol>

      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        <FormStatus state={state} />
        <Label>
          کد شش‌رقمی
          <Input name="code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" aria-invalid={state.error ? true : undefined} />
          {state.fieldErrors?.code ? <FieldError>{state.fieldErrors.code}</FieldError> : null}
        </Label>
        <Button type="submit" disabled={pending} className="justify-self-start">
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          فعال‌سازی
        </Button>
      </form>
    </div>
  );
}
