import { cn } from '@/lib/cn';

/**
 * Small tracked label that opens a section. A pill rather than a rule: on the
 * glass ground a hairline reads as an artefact, a tinted capsule reads as a tag.
 */
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
        'inline-flex w-fit items-center gap-2 rounded-pill px-3 py-1 text-2xs font-semibold uppercase tracking-[0.2em]',
        tone === 'light'
          ? 'bg-white/10 text-aqua-200'
          : 'bg-aqua-500/10 text-aqua-700',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          tone === 'light' ? 'bg-aqua-300' : 'bg-aqua-500',
        )}
      />
      {children}
    </p>
  );
}
