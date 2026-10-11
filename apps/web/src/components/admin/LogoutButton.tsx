import { LogOut } from 'lucide-react';
import { logout } from '@/server/actions/auth';
import { cn } from '@/lib/cn';

/** A plain form, so signing out works even before any client script loads. */
export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={cn('inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-red-600', className)}
      >
        <LogOut className="size-4" />
        خروج
      </button>
    </form>
  );
}
