'use client';

import { useTransition, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * A button that runs a bound Server Action after a confirmation, for the
 * one-click operations: delete, mark handled, revoke.
 */
export function ConfirmAction({
  action,
  confirm,
  children,
  variant = 'outline',
}: {
  action: () => Promise<unknown>;
  confirm?: string;
  children: ReactNode;
  variant?: 'outline' | 'destructive' | 'ghost' | 'primary';
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
