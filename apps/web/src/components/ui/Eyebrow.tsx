import { cn } from '@/lib/cn';

/** Small tracked label that opens a section. Sets the editorial rhythm. */
export function Eyebrow({
  children,
  className,
  tone = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'light';
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em]',
        tone === 'light' ? 'text-aqua-300' : 'text-aqua-700',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-px w-8',
          tone === 'light' ? 'bg-aqua-300/60' : 'bg-aqua-700/40',
        )}
      />
      {children}
    </p>
  );
}
