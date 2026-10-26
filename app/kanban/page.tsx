'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoardView } from '@/components/board-view';
import { EmptyState } from '@/components/states';
import { useLive } from '@/lib/use-live';
import { STATUSES, STATUS_LABEL, type BoardResponse, type Status } from '@/lib/types';

interface Filters {
  q: string;
  status: Status[];
  brd: string;
  sprint: string;
  assignee: string;
}
const EMPTY: Filters = { q: '', status: [], brd: '', sprint: '', assignee: '' };

export default function KanbanPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [options, setOptions] = useState<Pick<
    BoardResponse,
    'brds' | 'sprints' | 'assignees'
  > | null>(null);
  const [data, setData] = useState<BoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set('q', filters.q);
    if (filters.status.length) sp.set('status', filters.status.join(','));
    if (filters.brd) sp.set('brd', filters.brd);
    if (filters.sprint) sp.set('sprint', filters.sprint);
    if (filters.assignee) sp.set('assignee', filters.assignee);
    return sp.toString();
  }, [filters]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/board?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setOptions(
        (prev) => prev ?? { brds: json.brds, sprints: json.sprints, assignees: json.assignees },
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'gagal memuat kanban');
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, filters.q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, filters.q]);
  useLive(load);

  const active =
    filters.q || filters.status.length || filters.brd || filters.sprint || filters.assignee;
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className='flex h-full flex-col gap-3 overflow-y-auto p-4 md:p-6 xl:overflow-hidden'>
      <div className='shrink-0'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <h1 className='text-[28px] font-semibold leading-tight tracking-[-0.6px]'>Kanban</h1>
          <p className='text-[11px] text-ink-subtle' aria-live='polite'>
            {data ? `${data.tickets.length} ticket tampil` : 'memuat…'} · read-only, ubah status via
            CLI
          </p>
        </div>

        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <input
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder='Cari ID, nama ticket, backlog, BR…'
            aria-label='Cari ticket'
            className='min-w-[200px] flex-1 rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5 text-[12px] text-ink placeholder:text-ink-subtle focus:border-st-in-progress focus:outline-none'
          />
          {STATUSES.map((s) => {
            const on = filters.status.includes(s);
            return (
              <button
                key={s}
                type='button'
                aria-pressed={on}
                onClick={() =>
                  set('status', on ? filters.status.filter((x) => x !== s) : [...filters.status, s])
                }
                className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  on
                    ? 'border-ink-muted bg-surface-2 text-ink'
                    : 'border-hairline text-ink-muted hover:text-ink'
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            );
          })}
          <select
            value={filters.brd}
            onChange={(e) => set('brd', e.target.value)}
            aria-label='Filter BR'
            className='rounded-md border border-hairline bg-surface-1 px-2 py-1.5 text-[11px] text-ink-muted'
          >
            <option value=''>Semua BR</option>
            {options?.brds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id}
              </option>
            ))}
          </select>
          <select
            value={filters.sprint}
            onChange={(e) => set('sprint', e.target.value)}
            aria-label='Filter sprint'
            className='rounded-md border border-hairline bg-surface-1 px-2 py-1.5 text-[11px] text-ink-muted'
          >
            <option value=''>Semua Sprint</option>
            {options?.sprints.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filters.assignee}
            onChange={(e) => set('assignee', e.target.value)}
            aria-label='Filter assignee'
            className='rounded-md border border-hairline bg-surface-1 px-2 py-1.5 text-[11px] text-ink-muted'
          >
            <option value=''>Semua Assignee</option>
            {options?.assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          {active ? (
            <button
              type='button'
              onClick={() => setFilters(EMPTY)}
              className='rounded-md border border-hairline px-2.5 py-1.5 text-[11px] text-ink-muted hover:text-ink'
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <EmptyState>Gagal memuat: {error}</EmptyState>
      ) : data ? (
        <BoardView data={data} />
      ) : (
        <EmptyState>Memuat kanban…</EmptyState>
      )}
    </div>
  );
}
