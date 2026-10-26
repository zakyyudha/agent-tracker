'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Crumb, Field, Panel } from '@/components/ui';
import { DetailTabs } from '@/components/detail-tabs';
import { RichText } from '@/components/markdown';
import { StatusBadge, statusDotColor } from '@/components/status';
import { EmptyState, Skeleton } from '@/components/states';
import { useLive } from '@/lib/use-live';
import { STATUS_LABEL, type Status, type TicketResponse } from '@/lib/types';

export default function TicketPage() {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id ? decodeURIComponent(routeParams.id) : null;
  const [data, setData] = useState<TicketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/ticket/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'gagal memuat ticket');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);
  useLive(load);

  if (error) return <EmptyState>Gagal memuat: {error}</EmptyState>;
  if (!data) return <Skeleton rows={2} />;

  const { ticket, siblings, task, brd } = data;

  return (
    <div className='h-full overflow-y-auto p-4 md:p-6'>
      <nav className='mb-4 flex flex-wrap items-center gap-2 text-[13px]'>
        <Crumb href='/'>Board</Crumb>
        <span className='text-ink-subtle'>/</span>
        <Crumb href={`/backlog/${task.id}`}>{task.id}</Crumb>
        <span className='text-ink-subtle'>/</span>
        <span className='text-ink'>{ticket.id}</span>
      </nav>

      <p className='text-[12px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
        Ticket · {task.id} — {task.task_name}
      </p>
      <h1 className='mt-2 text-[24px] font-semibold leading-tight tracking-[-0.6px]'>
        {ticket.name}
      </h1>

      <dl className='mt-6 grid gap-3 rounded-lg border border-hairline bg-surface-1 p-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Field label='Status'>
          <StatusBadge status={ticket.status} className='bg-surface-3' />
        </Field>
        <Field label='Seq'>
          T{ticket.seq} dari {siblings.length} ticket
        </Field>
        <Field label='Assignee'>{ticket.assignee}</Field>
        <Field label='Sprint'>{ticket.sprint}</Field>
      </dl>

      {ticket.description && (
        <section className='mt-4 rounded-xl border border-hairline bg-surface-1 p-5'>
          <div className='mb-2 flex items-center justify-between border-b border-hairline pb-2'>
            <h2 className='text-[13px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
              Ticket Scope & Technical Deliverables
            </h2>
            <span className='text-[11px] text-ink-subtle'>Spesifikasi mikro ticket</span>
          </div>
          <RichText content={ticket.description} />
        </section>
      )}

      {ticket.evidence ? (
        <section className='mt-4 rounded-xl border border-hairline bg-surface-1 p-5'>
          <h2 className='mb-2 text-[13px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
            Evidence
          </h2>
          <RichText content={ticket.evidence} />
        </section>
      ) : (
        <section className='mt-4 rounded-xl border border-dashed border-hairline bg-surface-1 p-5'>
          <h2 className='mb-2 text-[13px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
            Evidence
          </h2>
          <p className='text-[14px] text-ink-subtle'>
            Belum ada. Naikkan status dengan bukti eksekusi nyata:
          </p>
          <pre className='mt-2 overflow-x-auto rounded-lg border border-hairline bg-surface-2 p-3 text-[13px] text-ink-muted'>
            {`node tracker/cli.mjs status ${ticket.id} in_progress
node tracker/cli.mjs status ${ticket.id} in_review --evidence "commit abc1234; test ..."`}
          </pre>
        </section>
      )}

      <section className='mt-6'>
        <h2 className='text-[20px] font-semibold tracking-[-0.4px]'>Alur ticket di backlog ini</h2>
        <ol className='mt-3 flex flex-wrap items-center gap-2'>
          {siblings.map((s) => {
            const current = s.id === ticket.id;
            return (
              <li key={s.id} className='flex items-center gap-2'>
                {s.seq > 1 && (
                  <span aria-hidden className='text-ink-subtle'>
                    →
                  </span>
                )}
                <Link
                  href={`/ticket/${s.id}`}
                  aria-current={current ? 'step' : undefined}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] ${
                    current
                      ? 'border-ink-muted bg-surface-3 text-ink'
                      : 'border-hairline text-ink-muted hover:text-ink'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-2 w-2 rounded-full ${statusDotColor(s.status as Status)}`}
                  />
                  T{s.seq} {s.name}
                  <span className='text-ink-subtle'>· {STATUS_LABEL[s.status as Status]}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <DetailTabs ac={task.ac} dod={task.dod} notes={task.notes} brd={brd} />

      <p className='mt-6 text-[13px] text-ink-subtle'>
        Diperbarui {ticket.updated_at} ·{' '}
        <Link href={`/backlog/${task.id}`} className='underline hover:text-ink'>
          buka backlog {task.id}
        </Link>
      </p>
    </div>
  );
}
