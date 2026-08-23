import { cn } from '@/lib/cn';

export function Badge({
  children,
  className,
  tone = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'mineral' | 'light';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium tracking-wide',
        tone === 'default' && 'bg-aqua-50 text-aqua-800',
        tone === 'mineral' && 'bg-mineral-50 text-mineral-700',
        tone === 'light' && 'bg-white/10 text-mist-100',
        className,
      )}
    >
      {children}
    </span>
  );
}
