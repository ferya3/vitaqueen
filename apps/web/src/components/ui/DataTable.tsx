import { cn } from '@/lib/cn';

export type Column = { key: string; label: string; numeric?: boolean };
export type Row = Record<string, string | number | null | undefined>;

/**
 * Laboratory-grade tabular data, in two shapes.
 *
 * A five-column analysis sheet cannot be read on a 390px screen. Scrolling it
 * sideways is the usual answer and it is a bad one: the scroll is invisible
 * until you try it, values end up sliced down the middle, and the columns that
 * matter most — the permitted limit, the method — are the ones off-screen.
 *
 * So below `sm` each row becomes its own block: the first column is the
 * heading, the rest are label/value pairs. Same data, same order, no scrolling.
 * From `sm` up it is a real table, which is what the data deserves once there
 * is room for it.
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
  const [first, ...rest] = columns;
  const dark = tone === 'dark';

  return (
    <div className={className}>
      {caption ? (
        <p className={cn('pb-4 text-sm', dark ? 'text-mist-400' : 'text-ink-muted')}>{caption}</p>
      ) : null}

      {/* Phones: one block per row. */}
      <ul className="grid gap-3 sm:hidden">
        {rows.map((row, index) => (
          <li
            key={index}
            className={cn(
              'rounded-md border p-4',
              dark ? 'border-white/12 bg-white/[0.04]' : 'border-line bg-white/70',
            )}
          >
            <p className={cn('font-medium', dark ? 'text-white' : 'text-abyss-900')}>
              {row[first.key] ?? '—'}
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {rest.map((column) => (
                <div key={column.key} className="flex flex-col gap-0.5">
                  <dt
                    className={cn(
                      'text-2xs uppercase tracking-[0.14em]',
                      dark ? 'text-mist-500' : 'text-ink-muted',
                    )}
                  >
                    {column.label}
                  </dt>
                  <dd className={cn('tabular', dark ? 'text-mist-200' : 'text-abyss-900')}>
                    {row[column.key] ?? '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* Tablet and up: the table proper. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr
              className={cn(
                'border-b',
                dark ? 'border-white/15 text-mist-400' : 'border-abyss-900/15 text-ink-muted',
              )}
            >
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    // Cells need their own gutter: a right-aligned number sits
                    // flush against the left-aligned column beside it
                    // otherwise, and "0.14" + "mg/L" reads as "0.14mg/L".
                    'px-3 py-3 text-xs font-medium uppercase tracking-[0.16em] first:ps-0 last:pe-0',
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
                  dark ? 'border-white/8 hover:bg-white/[0.04]' : 'border-line hover:bg-mist-100',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-3.5 first:ps-0 last:pe-0',
                      column.numeric ? 'text-end tabular' : 'text-start',
                      column.key === first.key && 'font-medium',
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
    </div>
  );
}
