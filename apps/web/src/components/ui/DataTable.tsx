import { cn } from '@/lib/cn';

export type Column = { key: string; label: string; numeric?: boolean };
export type Row = Record<string, string | number | null | undefined>;

/**
 * Laboratory-grade table: tabular figures, sticky header, and — critically —
 * its own horizontal scroll container so a 6-column analysis sheet never makes
 * the whole page scroll sideways on a phone.
 */
export function DataTable({
  columns,
  rows,
  caption,
  className,
  tone = 'light',
}: {
  columns: Column[];
  rows: Row[];
  caption?: string;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <div className={cn('-mx-(--spacing-gutter) overflow-x-auto px-(--spacing-gutter)', className)}>
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        {caption ? <caption className="pb-4 text-start text-sm text-ink-muted">{caption}</caption> : null}
        <thead>
          <tr
            className={cn(
              'border-b',
              tone === 'dark' ? 'border-white/15 text-mist-400' : 'border-abyss-900/15 text-ink-muted',
            )}
          >
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'py-3 text-xs font-medium uppercase tracking-[0.16em]',
                  column.numeric ? 'text-end' : 'text-start',
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={cn(
                'border-b transition-colors',
                tone === 'dark'
                  ? 'border-white/8 hover:bg-white/[0.04]'
                  : 'border-line hover:bg-mist-100',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'py-3.5',
                    column.numeric ? 'text-end tabular' : 'text-start',
                    column.key === columns[0].key && 'font-medium',
                  )}
                >
                  {row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
