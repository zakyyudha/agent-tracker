import Link from 'next/link';
import type { TicketWithRefs } from '@/lib/types';

// Daftar ticket ringkas (frontier / berjalan). Status ditandai dot + teks label, bukan warna saja.
export function TicketList({ tickets, empty }: { tickets: TicketWithRefs[]; empty: string }) {
  if (!tickets.length) return <p className='text-[12px] text-ink-subtle'>{empty}</p>;
  return (
    <ul className='divide-y divide-hairline-soft'>
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`/ticket/${t.id}`}
            className='flex items-baseline gap-3 rounded px-1 py-2 hover:bg-surface-1'
          >
            <span className='font-mono text-[11px] text-ink-subtle'>{t.id}</span>
            <span className='min-w-0 flex-1 truncate text-[13px] text-ink'>{t.name}</span>
            <span className='shrink-0 text-[11px] text-ink-subtle'>{t.task.id}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
