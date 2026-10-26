'use client';

import { useState } from 'react';
import { RichText } from './markdown';

type TabKey = 'ac' | 'dod' | 'notes' | 'brd' | 'all';

interface DetailTabsProps {
  ac?: string | null;
  dod?: string | null;
  notes?: string | null;
  brd: {
    id: string;
    title: string;
    description: string;
  };
}

export function DetailTabs({ ac, dod, notes, brd }: DetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('ac');

  const tabs: { key: TabKey; label: string; badge?: string; hasContent: boolean }[] = [
    {
      key: 'ac',
      label: 'Acceptance Criteria',
      badge: ac ? 'AC' : undefined,
      hasContent: !!ac && ac.trim().length > 0,
    },
    {
      key: 'dod',
      label: 'Definition of Done',
      badge: dod ? 'DoD' : undefined,
      hasContent: !!dod && dod.trim().length > 0,
    },
    {
      key: 'notes',
      label: 'Architectural Notes',
      badge: notes ? 'Notes' : undefined,
      hasContent: !!notes && notes.trim().length > 0,
    },
    {
      key: 'brd',
      label: `BR (${brd.id})`,
      badge: 'BRD',
      hasContent: !!brd.description && brd.description.trim().length > 0,
    },
    {
      key: 'all',
      label: 'Semua (Full View)',
      hasContent: true,
    },
  ];

  return (
    <div className='mt-6 rounded-xl border border-hairline bg-surface-1'>
      {/* Tab Navigation Header */}
      <div className='flex flex-wrap items-center gap-1 border-b border-hairline bg-surface-2/60 px-4 pt-3'>
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type='button'
              onClick={() => setActiveTab(t.key)}
              className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'border-t-2 border-st-done bg-surface-1 text-ink'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    isActive ? 'bg-surface-3 text-ink' : 'bg-surface-3/50 text-ink-subtle'
                  }`}
                >
                  {t.badge}
                </span>
              )}
              {!t.hasContent && t.key !== 'all' && (
                <span className='text-[11px] text-ink-subtle'>(kosong)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className='p-5 md:p-6'>
        {activeTab === 'ac' && (
          <div>
            <div className='mb-3 flex items-center justify-between border-b border-hairline pb-2'>
              <h3 className='text-[14px] font-semibold text-ink'>Acceptance Criteria</h3>
              <span className='text-[11px] text-ink-subtle'>Spesifikasi visual & kontrak API</span>
            </div>
            {ac ? (
              <RichText content={ac} />
            ) : (
              <p className='text-[13px] text-ink-subtle'>Belum ada Acceptance Criteria.</p>
            )}
          </div>
        )}

        {activeTab === 'dod' && (
          <div>
            <div className='mb-3 flex items-center justify-between border-b border-hairline pb-2'>
              <h3 className='text-[14px] font-semibold text-ink'>Definition of Done</h3>
              <span className='text-[11px] text-ink-subtle'>Standar mutu rilis & verifikasi</span>
            </div>
            {dod ? (
              <RichText content={dod} />
            ) : (
              <p className='text-[13px] text-ink-subtle'>Belum ada Definition of Done.</p>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <div className='mb-3 flex items-center justify-between border-b border-hairline pb-2'>
              <h3 className='text-[14px] font-semibold text-ink'>Architectural Notes</h3>
              <span className='text-[11px] text-ink-subtle'>
                Diagram arsitektur, DTO, & skema basis data
              </span>
            </div>
            {notes ? (
              <RichText content={notes} />
            ) : (
              <p className='text-[13px] text-ink-subtle'>Belum ada Architectural Notes.</p>
            )}
          </div>
        )}

        {activeTab === 'brd' && (
          <div>
            <div className='mb-3 border-b border-hairline pb-2'>
              <span className='text-[11px] font-semibold uppercase tracking-wider text-ink-subtle'>
                {brd.id}
              </span>
              <h3 className='text-[15px] font-semibold text-ink'>{brd.title}</h3>
            </div>
            <RichText content={brd.description} />
          </div>
        )}

        {activeTab === 'all' && (
          <div className='space-y-8'>
            <section>
              <h3 className='mb-3 text-[14px] font-semibold uppercase tracking-wider text-ink-muted border-b border-hairline pb-1.5'>
                Business Requirement ({brd.id} — {brd.title})
              </h3>
              <RichText content={brd.description} />
            </section>

            <section>
              <h3 className='mb-3 text-[14px] font-semibold uppercase tracking-wider text-ink-muted border-b border-hairline pb-1.5'>
                Acceptance Criteria
              </h3>
              {ac ? <RichText content={ac} /> : <p className='text-[13px] text-ink-subtle'>—</p>}
            </section>

            <section>
              <h3 className='mb-3 text-[14px] font-semibold uppercase tracking-wider text-ink-muted border-b border-hairline pb-1.5'>
                Definition of Done
              </h3>
              {dod ? <RichText content={dod} /> : <p className='text-[13px] text-ink-subtle'>—</p>}
            </section>

            <section>
              <h3 className='mb-3 text-[14px] font-semibold uppercase tracking-wider text-ink-muted border-b border-hairline pb-1.5'>
                Architectural Notes
              </h3>
              {notes ? (
                <RichText content={notes} />
              ) : (
                <p className='text-[13px] text-ink-subtle'>—</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
