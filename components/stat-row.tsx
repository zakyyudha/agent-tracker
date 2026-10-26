import type { BoardStats } from '@/lib/types';

// KPI polos (bukan kartu berbingkai) — angka nyata dari DB, tanpa delta/trend palsu.
export function StatRow({ stats }: { stats: BoardStats }) {
  const items: [number | string, string][] = [
    [stats.brds, 'Business Requirement'],
    [stats.tasks, 'Backlog'],
    [stats.tickets, 'Ticket'],
    [stats.sp_total, 'Story Points'],
    [`${stats.done}/${stats.tickets}`, 'Selesai'],
  ];
  return (
    <dl className='flex flex-wrap gap-x-10 gap-y-3'>
      {items.map(([value, label]) => (
        <div key={label}>
          <dd className='text-[24px] font-semibold leading-none tracking-[-0.4px]'>{value}</dd>
          <dt className='mt-1.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-subtle'>
            {label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

export function Progress({
  done,
  total,
  width = 'w-32',
}: {
  done: number;
  total: number;
  width?: string;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className='flex items-center gap-2'>
      <div className={`h-1 ${width} overflow-hidden rounded-full bg-surface-3`}>
        <div
          className='h-1 rounded-full bg-st-done'
          style={{ width: `${pct}%` }}
          role='progressbar'
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${done} dari ${total} ticket selesai`}
        />
      </div>
      <span className='text-[11px] tabular-nums text-ink-subtle'>
        {done}/{total}
      </span>
    </div>
  );
}
