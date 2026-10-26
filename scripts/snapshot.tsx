// Snapshot statis → tracker/index.html (commit-able).
// Satu file, 3 bagian ber-anchor (Dashboard, Index Requirement, Kanban ringkas — hitungan per status).
// Memakai komponen yang sama dengan app live agar tidak bisa drift.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrTable } from '../components/br-table';
import { StatRow, Progress } from '../components/stat-row';
import { TicketList } from '../components/ticket-list';
import { statusDotColor } from '../components/status';
import { getBoard } from '../lib/db';
import { STATUSES, STATUS_LABEL } from '../lib/types';

const NOW = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

// 1. CSS: compile Tailwind dari app/globals.css (deteksi class otomatis v4).
const CSS_OUT = path.resolve(process.cwd(), '.snapshot.css');
if (existsSync(CSS_OUT)) rmSync(CSS_OUT);
try {
  execSync('npx @tailwindcss/cli -i app/globals.css -o .snapshot.css --minify', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
} catch {
  console.error('snapshot gagal: compile Tailwind. Jalankan `npm install` di tracker/ dulu.');
  process.exit(1);
}
const css = readFileSync(CSS_OUT, 'utf8');

const data = getBoard();
const frontier = data.tickets.filter((t) => t.is_frontier && t.status === 'todo').slice(0, 10);
const running = data.tickets.filter((t) => t.status === 'in_progress' || t.status === 'in_review');
const counts = Object.fromEntries(
  STATUSES.map((s) => [s, data.tickets.filter((t) => t.status === s).length]),
);

const body = renderToStaticMarkup(
  <div className='mx-auto max-w-[1200px] px-6 py-10 md:px-10'>
    <header className='flex flex-wrap items-baseline justify-between gap-3 border-b border-hairline pb-4'>
      <div>
        <h1 className='text-[28px] font-semibold leading-tight tracking-[-0.6px]'>
          Agent Tracker — Snapshot
        </h1>
        <p className='mt-1 text-[12px] text-ink-muted'>
          Snapshot statis dari kanban.db · board live (realtime + filter): `pnpm start` di tracker/
          → :3100
        </p>
      </div>
      <nav className='flex gap-4 text-[12px] text-ink-muted'>
        <a href='#dashboard' className='hover:text-ink'>
          Dashboard
        </a>
        <a href='#requirements' className='hover:text-ink'>
          Index Requirement
        </a>
        <a href='#kanban' className='hover:text-ink'>
          Kanban
        </a>
      </nav>
    </header>

    <section id='dashboard' className='pt-8'>
      <h2 className='text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-subtle'>
        Dashboard
      </h2>
      <div className='mt-3'>
        <StatRow stats={data.stats} />
      </div>
      <div className='mt-4'>
        <Progress done={data.stats.done} total={data.stats.tickets} width='w-64' />
      </div>
      <div className='mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]'>
        <div className='rounded-lg border border-hairline bg-surface-1 p-3'>
          <h3 className='mb-2 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
            Progres per Business Requirement
          </h3>
          <BrTable brds={data.brds} compact />
        </div>
        <div className='space-y-4'>
          <div className='rounded-lg border border-hairline bg-surface-1 p-3'>
            <h3 className='mb-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
              Frontier — siap dikerjakan
            </h3>
            <TicketList tickets={frontier} empty='Tidak ada ticket di frontier.' />
          </div>
          <div className='rounded-lg border border-hairline bg-surface-1 p-3'>
            <h3 className='mb-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
              Berjalan & Review
            </h3>
            <TicketList tickets={running} empty='Belum ada ticket berjalan.' />
          </div>
        </div>
      </div>
    </section>

    <section id='requirements' className='pt-10'>
      <h2 className='text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-subtle'>
        Index Requirement
      </h2>
      <div className='mt-3 rounded-lg border border-hairline bg-surface-1 p-3'>
        <BrTable brds={data.brds} />
      </div>
    </section>

    <section id='kanban' className='pt-10'>
      <h2 className='text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-subtle'>
        Kanban — ringkasan per status
      </h2>
      <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {STATUSES.map((s) => (
          <div key={s} className='rounded-lg border border-hairline bg-surface-1 px-4 py-3'>
            <p className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
              <span aria-hidden className={`h-2 w-2 rounded-full ${statusDotColor(s)}`} />
              {STATUS_LABEL[s]}
            </p>
            <p className='mt-1 text-[24px] font-semibold leading-none tabular-nums'>{counts[s]}</p>
          </div>
        ))}
      </div>
      <p className='mt-2 text-[11px] text-ink-subtle'>
        Kartu kanban lengkap (108 ticket, filter, detail) hanya tersedia di app live.
      </p>
    </section>

    <footer className='mt-12 border-t border-hairline-soft pt-4 text-[11px] text-ink-subtle'>
      Di-render {NOW} · sumber: tracker/kanban.db · regenerate: node tracker/cli.mjs render
    </footer>
  </div>,
);

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Agent Tracker — Snapshot</title>
<!-- SNAPSHOT STATIS — jangan edit manual. Regenerate: node tracker/cli.mjs render -->
<style>${css}</style>
</head>
<body>${body}</body>
</html>`;

writeFileSync(path.resolve(process.cwd(), 'index.html'), html);
if (existsSync(CSS_OUT)) rmSync(CSS_OUT);
console.log(`snapshot OK: tracker/index.html (${data.stats.tickets} ticket)`);
