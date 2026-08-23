import { cn } from '@/lib/cn';

/**
 * Wordmark + drop. Inline SVG so it inherits `currentColor` and never causes a
 * second network request in the header.
 */
export function Logo({ className, label }: { className?: string; label: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 24 28" aria-hidden className="h-6 w-auto shrink-0" fill="none">
        <path
          d="M12 1.5C12 1.5 22 12.2 22 18a10 10 0 1 1-20 0C2 12.2 12 1.5 12 1.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M7.6 18.4c0 2.6 2 4.6 4.4 4.6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>
      <span className="font-display text-lg font-medium tracking-[0.12em] uppercase">
        {label}
      </span>
    </span>
  );
}
