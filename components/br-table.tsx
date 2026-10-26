import Link from 'next/link';
import type { BoardBr } from '@/lib/types';
import { Progress } from './stat-row';

// Tabel BR — dipakai Dashboard (ringkas), Index Requirement (penuh), dan snapshot.
// table-fixed + lebar kolom disengaja agar pill/progress tidak terdorong keluar viewport.
export function BrTable({
  brds,
  showDescription = true,
  compact = false,
  scrollable = false,
}: {
  brds: BoardBr[];
  showDescription?: boolean;
  compact?: boolean;
  scrollable?: boolean;
}) {
  return (
    <div className={scrollable ? 'min-h-0 flex-1 overflow-y-auto' : ''}>
      <table className='w-full table-fixed border-collapse text-left'>
        <colgroup>
          <col className='w-[96px]' />
          <col />
          <col className='w-[128px]' />
          <col className='w-[160px]' />
        </colgroup>
        <thead className='sticky top-0 z-10 bg-canvas'>
          <tr className='border-b border-hairline text-[11px] uppercase tracking-[0.6px] text-ink-subtle'>
            <th className='py-2 pr-3 font-semibold'>BR</th>
            <th className='py-2 pr-3 font-semibold'>Requirement</th>
            <th className='py-2 pr-3 font-semibold'>Backlog</th>
            <th className='py-2 font-semibold'>Progres</th>
          </tr>
        </thead>
        <tbody>
          {brds.map((b) => (
            <tr
              key={b.id}
              className='border-b border-hairline-soft align-top hover:bg-surface-1/60'
            >
              <td className='py-2.5 pr-3'>
                <Link
                  href={b.task_ids[0] ? `/backlog/${b.task_ids[0]}` : '/requirements'}
                  className='inline-block max-w-full truncate rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-muted hover:text-ink'
                  title={b.id}
                >
                  {b.id}
                </Link>
              </td>
              <td className='min-w-0 py-2.5 pr-4'>
                <Link
                  href={b.task_ids[0] ? `/backlog/${b.task_ids[0]}` : '/requirements'}
                  className='group block'
                >
                  <span
                    className='block truncate text-[13px] font-medium text-ink group-hover:underline'
                    title={b.title}
                  >
                    {b.title}
                  </span>
                  {showDescription && (
                    <p
                      className='mt-0.5 truncate text-[11px] text-ink-subtle'
                      title={b.description}
                    >
                      {b.description}
                    </p>
                  )}
                </Link>
              </td>
              <td className='py-2.5 pr-4'>
                {b.task_ids.map((id) => (
                  <Link
                    key={id}
                    href={`/backlog/${id}`}
                    className='block truncate font-mono text-[11px] text-ink-muted hover:text-ink'
                    title={id}
                  >
                    {id}
                  </Link>
                ))}
              </td>
              <td className='py-2.5'>
                <Progress done={b.tickets_done} total={b.tickets_total} width='w-28' />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
