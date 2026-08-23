import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export function Breadcrumbs({
  trail,
  className,
  tone = 'default',
}: {
  trail: Array<{ name: string; path: string }>;
  className?: string;
  tone?: 'default' | 'light';
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs', className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((item, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {last ? (
                <span
                  aria-current="page"
                  className={tone === 'light' ? 'text-mist-400' : 'text-ink-muted'}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className={cn(
                    'transition-colors',
                    tone === 'light' ? 'text-mist-300 hover:text-white' : 'text-aqua-700 hover:text-aqua-500',
                  )}
                >
                  {item.name}
                </Link>
              )}
              {!last ? (
                <span aria-hidden className={tone === 'light' ? 'text-white/25' : 'text-mist-400'}>
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
