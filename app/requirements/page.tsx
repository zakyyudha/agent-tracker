'use client';

import { useMemo, useState } from 'react';
import { useBoard } from '@/lib/use-board';
import { BrTable } from '@/components/br-table';
import { EmptyState, Skeleton } from '@/components/states';

type Sort = 'id' | 'progress' | 'title';

// Index Requirement: seluruh BR dalam tabel dense, dicari & diurut.
export default function RequirementsPage() {
  const { data, error, loading } = useBoard();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('id');

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const filtered = data.brds.filter(
      (b) =>
        !needle ||
        [b.id, b.title, b.description, ...b.task_ids].some((v) => v.toLowerCase().includes(needle)),
    );
    const pct = (b: (typeof filtered)[number]) =>
      b.tickets_total ? b.tickets_done / b.tickets_total : 0;
    return [...filtered].sort((a, b) =>
      sort === 'id'
        ? a.id.localeCompare(b.id)
        : sort === 'title'
          ? a.title.localeCompare(b.title)
          : pct(b) - pct(a),
    );
  }, [data, q, sort]);

  return (
    <div className='flex h-full flex-col p-4 md:p-6'>
      <header className='shrink-0'>
        <h1 className='text-[28px] font-semibold leading-tight tracking-[-0.6px]'>
          Index Requirement
        </h1>
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Cari BR / judul / backlog…'
            aria-label='Cari requirement'
            className='min-w-[220px] rounded-md border border-hairline bg-surface-1 px-2.5 py-1.5 text-[12px] text-ink placeholder:text-ink-subtle focus:border-st-in-progress focus:outline-none'
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label='Urutkan'
            className='rounded-md border border-hairline bg-surface-1 px-2 py-1.5 text-[11px] text-ink-muted'
          >
            <option value='id'>Urut: BR ID</option>
            <option value='title'>Urut: Judul</option>
            <option value='progress'>Urut: Progres</option>
          </select>
          <span className='text-[11px] text-ink-subtle' aria-live='polite'>
            {loading ? 'memuat…' : `${rows.length} BR`}
          </span>
        </div>
      </header>

      <section className='mt-4 flex min-h-0 flex-1 flex-col rounded-lg border border-hairline bg-surface-1'>
        {error ? (
          <EmptyState>Gagal memuat: {error}</EmptyState>
        ) : loading && !data ? (
          <div className='p-4'>
            <Skeleton rows={3} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>Tidak ada BR yang cocok dengan pencarian.</EmptyState>
        ) : (
          <div className='flex min-h-0 flex-1 flex-col p-2'>
            <BrTable brds={rows} scrollable />
          </div>
        )}
      </section>
    </div>
  );
}
