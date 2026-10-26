'use client';

import { useBoard } from '@/lib/use-board';
import { BrTable } from '@/components/br-table';
import { StatRow } from '@/components/stat-row';
import { TicketList } from '@/components/ticket-list';
import { EmptyState, Skeleton } from '@/components/states';
import { STATUS_LABEL } from '@/lib/types';
import { statusDotColor } from '@/components/status';

// Dashboard: satu pandangan — angka nyata, progres per BR, frontier, yang berjalan.
export default function DashboardPage() {
  const { data, error, loading } = useBoard();

  if (error) return <Pane error={error} />;
  if (loading || !data) return <Pane loading />;

  const frontier = data.tickets.filter((t) => t.is_frontier && t.status === 'todo').slice(0, 10);
  const running = data.tickets.filter(
    (t) => t.status === 'in_progress' || t.status === 'in_review',
  );

  return (
    <Pane>
      <header className='shrink-0'>
        <h1 className='text-[28px] font-semibold leading-tight tracking-[-0.6px]'>Dashboard</h1>
        <div className='mt-3'>
          <StatRow stats={data.stats} />
        </div>
      </header>

      <div className='mt-5 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <section className='flex min-h-0 flex-col rounded-lg border border-hairline bg-surface-1'>
          <header className='shrink-0 border-b border-hairline px-4 py-2.5'>
            <h2 className='text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
              Progres per Business Requirement
            </h2>
          </header>
          <div className='p-2'>
            <BrTable brds={data.brds} compact scrollable />
          </div>
        </section>

        <div className='flex min-h-0 flex-col gap-4'>
          <section className='flex min-h-0 flex-1 flex-col rounded-lg border border-hairline bg-surface-1'>
            <header className='shrink-0 border-b border-hairline px-4 py-2.5'>
              <h2 className='text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
                Frontier — siap dikerjakan
              </h2>
            </header>
            <div className='min-h-0 flex-1 overflow-y-auto px-3 py-1'>
              <TicketList tickets={frontier} empty='Tidak ada ticket di frontier.' />
            </div>
          </section>

          <section className='flex min-h-0 flex-1 flex-col rounded-lg border border-hairline bg-surface-1'>
            <header className='shrink-0 border-b border-hairline px-4 py-2.5'>
              <h2 className='text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
                Berjalan & Review
              </h2>
            </header>
            <div className='min-h-0 flex-1 overflow-y-auto px-3 py-1'>
              {running.length === 0 ? (
                <p className='py-3 text-[12px] text-ink-subtle'>
                  Belum ada ticket berjalan. Mulai dari frontier (status: {STATUS_LABEL.in_progress}
                  ).
                </p>
              ) : (
                running.map((t) => (
                  <div
                    key={t.id}
                    className='flex items-baseline gap-2 border-b border-hairline-soft py-2 last:border-0'
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotColor(t.status)}`}
                    />
                    <span className='sr-only'>{STATUS_LABEL[t.status]}: </span>
                    <span className='font-mono text-[11px] text-ink-subtle'>{t.id}</span>
                    <span className='min-w-0 flex-1 truncate text-[13px]'>{t.name}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </Pane>
  );
}

// Kontainer pane dashboard: scroll internal, header tetap terlihat.
function Pane({
  children,
  loading = false,
  error,
}: {
  children?: React.ReactNode;
  loading?: boolean;
  error?: string;
}) {
  return (
    <div className='h-full overflow-y-auto p-4 md:p-6'>
      {error ? (
        <EmptyState>Gagal memuat: {error}</EmptyState>
      ) : loading ? (
        <Skeleton rows={3} />
      ) : (
        children
      )}
    </div>
  );
}
