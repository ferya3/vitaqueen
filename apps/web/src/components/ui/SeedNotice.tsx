import { cn } from '@/lib/cn';

/**
 * Shown whenever a page is rendering seeded sample data instead of real CMS
 * content. Laboratory values and certificates must never look authoritative
 * when they are placeholders.
 */
export function SeedNotice({ message, className }: { message: string; className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        'inline-flex items-center gap-2.5 rounded-pill border border-dashed border-aqua-500/40 bg-aqua-50/70 px-4 py-2 text-xs text-aqua-800',
        className,
      )}
    >
      <span aria-hidden className="inline-block size-1.5 shrink-0 rounded-full bg-aqua-500" />
      {message}
    </p>
  );
}
