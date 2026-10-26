'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Crumb, Field, Panel } from '@/components/ui';
import { DetailTabs } from '@/components/detail-tabs';
import { StatusBadge } from '@/components/status';
import { EmptyState, Skeleton } from '@/components/states';
import { useLive } from '@/lib/use-live';
import type { BacklogResponse } from '@/lib/types';

export default function BacklogPage() {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id ? decodeURIComponent(routeParams.id) : null;
  const [data, setData] = useState<BacklogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/backlog/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'gagal memuat backlog');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);
  useLive(load);

  if (error) return <EmptyState>Gagal memuat: {error}</EmptyState>;
  if (!data) return <Skeleton rows={2} />;

  const { task, brd, tickets } = data;
  const done = tickets.filter((t) => t.status === 'done').length;

  return (
    <div className='h-full overflow-y-auto p-4 md:p-6'>
      <nav className='mb-4 flex items-center gap-2 text-[13px]'>
        <Crumb href='/'>Board</Crumb>
        <span className='text-ink-subtle'>/</span>
        <span className='text-ink-subtle'>{brd.id}</span>
        <span className='text-ink-subtle'>/</span>
        <span className='text-ink'>{task.id}</span>
      </nav>

      <p className='text-[12px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
        Backlog · {brd.id} — {brd.title}
      </p>
      <h1 className='mt-2 text-[24px] font-semibold leading-tight tracking-[-0.6px]'>
        {task.task_name}
      </h1>
      <p className='mt-2 text-[14px] text-ink-muted'>
        {task.id} · {done}/{tickets.length} ticket selesai · SP {task.sp ?? '-'}
      </p>

      <dl className='mt-6 grid gap-3 rounded-lg border border-hairline bg-surface-1 p-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Field label='ID'>{task.id}</Field>
        <Field label='Module'>{task.module}</Field>
        <Field label='Use Case'>{task.usecase}</Field>
        <Field label='Figma'>
          {task.figma && task.figma !== 'TBD (link Figma)' ? (
            <a href={task.figma} className='underline'>
              {task.figma}
            </a>
          ) : (
            'TBD'
          )}
        </Field>
      </dl>

      <DetailTabs ac={task.ac} dod={task.dod} notes={task.notes} brd={brd} />

      <section className='mt-10'>
        <h2 className='text-[20px] font-semibold tracking-[-0.4px]'>Ticket</h2>
        <p className='mt-1 text-[13px] text-ink-subtle'>
          Urutan eksekusi (seq) wajib berurut; ticket bertanda ⚡ adalah frontier yang boleh
          dikerjakan.
        </p>
        <div className='mt-3 overflow-x-auto'>
          <table className='w-full border-collapse text-left'>
            <thead>
              <tr className='border-b border-hairline text-[12px] uppercase tracking-[0.6px] text-ink-subtle'>
                <th className='py-2 pr-3 font-semibold'>Seq</th>
                <th className='py-2 pr-3 font-semibold'>Ticket</th>
                <th className='py-2 pr-3 font-semibold'>Nama</th>
                <th className='py-2 pr-3 font-semibold'>Status</th>
                <th className='py-2 pr-3 font-semibold'>Evidence</th>
                <th className='py-2 font-semibold'>Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className='border-b border-hairline-soft align-top'>
                  <td className='py-3 pr-3 text-[13px] text-ink-muted'>T{t.seq}</td>
                  <td className='py-3 pr-3'>
                    <Link
                      href={`/ticket/${t.id}`}
                      className='text-[13px] text-ink-muted underline hover:text-ink'
                    >
                      {t.id}
                    </Link>
                  </td>
                  <td className='py-3 pr-3 text-[15px]'>
                    {t.name}
                    {t.is_frontier && t.status === 'todo' ? (
                      <span className='ml-2 rounded-full bg-surface-3 px-2 py-0.5 text-[12px] text-st-in-review'>
                        ⚡ frontier
                      </span>
                    ) : null}
                  </td>
                  <td className='py-3 pr-3'>
                    <StatusBadge status={t.status} className='bg-surface-3' />
                  </td>
                  <td className='py-3 pr-3 text-[13px] text-ink-subtle'>{t.evidence ?? '—'}</td>
                  <td className='py-3 text-[13px] text-ink-subtle'>{t.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
