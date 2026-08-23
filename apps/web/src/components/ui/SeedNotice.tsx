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
        'inline-flex items-center gap-2 rounded-md border border-dashed border-aqua-500/40 bg-aqua-500/5 px-4 py-2.5 text-xs text-aqua-700',
        className,
      )}
    >
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-aqua-500" />
      {message}
    </p>
  );
}
