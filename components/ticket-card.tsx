import Link from 'next/link';
import { STATUS_LABEL, type TicketWithRefs } from '@/lib/types';
import { statusDotColor } from './status';

// Kartu kanban compact (3 baris). Status dibawa dot + label tersembunyi (bukan stripe dekoratif).
export function TicketCard({ ticket }: { ticket: TicketWithRefs }) {
  return (
    <Link
      href={`/ticket/${ticket.id}`}
      className='block rounded-md border border-hairline bg-surface-1 px-3 py-2 transition hover:border-ink-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-st-in-review'
    >
      <div className='flex items-center justify-between gap-2 text-[11px] text-ink-subtle'>
        <span className='flex items-center gap-1.5 font-mono'>
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${statusDotColor(ticket.status)}`}
          />
          <span className='sr-only'>{STATUS_LABEL[ticket.status]}: </span>
          {ticket.id}
        </span>
        <span>{ticket.task.id}</span>
      </div>
      <p className='mt-1 truncate text-[13px] font-medium text-ink' title={ticket.name}>
        {ticket.name}
      </p>
      <p className='mt-0.5 text-[11px] text-ink-subtle'>
        SP {ticket.task.sp ?? '-'} · {ticket.sprint}
        {ticket.is_frontier && ticket.status === 'todo' ? ' · frontier' : ''}
      </p>
    </Link>
  );
}
