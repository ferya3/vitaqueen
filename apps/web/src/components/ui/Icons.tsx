import { cn } from '@/lib/cn';

type IconProps = { className?: string };

/** Direction-aware arrow: points the way the reader is going, in any script. */
export function ArrowIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      fill="none"
      className={cn('h-4 w-4 rtl:-scale-x-100', className)}
    >
      <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden fill="none" className={cn('h-4 w-4', className)}>
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden fill="none" className={cn('h-4 w-4', className)}>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden fill="none" className={cn('h-4 w-4', className)}>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden fill="none" className={cn('h-4 w-4', className)}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 10h14M10 3c2 2.4 2 11.6 0 14M10 3c-2 2.4-2 11.6 0 14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
