import { STATUSES, STATUS_LABEL, type BoardResponse } from '@/lib/types';
import { TicketCard } from './ticket-card';
import { statusDotColor } from './status';

// Isi kanban: 4 kolom, tiap kolom scroll internal sendiri (halaman tidak memanjang).
export function BoardView({ data }: { data: BoardResponse }) {
  return (
    <div className='grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {STATUSES.map((status) => {
        const items = data.tickets.filter((t) => t.status === status);
        return (
          <section
            key={status}
            data-column={status}
            className='flex max-h-[70vh] min-h-0 flex-col rounded-lg border border-hairline bg-surface-1 xl:max-h-none'
          >
            <header className='flex shrink-0 items-center justify-between border-b border-hairline px-3 py-2'>
              <span className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
                <span aria-hidden className={`h-2 w-2 rounded-full ${statusDotColor(status)}`} />
                {STATUS_LABEL[status]}
              </span>
              <span className='text-[11px] tabular-nums text-ink-subtle'>{items.length}</span>
            </header>
            <div className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2'>
              {items.map((t) => (
                <TicketCard key={t.id} ticket={t} />
              ))}
              {items.length === 0 && (
                <p className='px-2 py-6 text-center text-[11px] text-ink-subtle'>Kosong</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
