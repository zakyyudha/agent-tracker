// Presentation: format output manusia (default) / JSON (--json).
import { STATUS_LABEL, type Backlog, type Brd, type Status, type Ticket } from '../domain/entities';
import type { BacklogContext, StatsSummary, TicketContext } from '../application/usecases';
import { DETAILING_RULE } from '../application/usecases';

export function json(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function ticketLine(ticket: Ticket): string {
  const frontier = ticket.is_frontier ? 'frontier ' : '';
  const evidence = ticket.evidence ? `  [evidence: ${ticket.evidence}]` : '';
  return `${ticket.id}  T${ticket.seq}  ${STATUS_LABEL[ticket.status].padEnd(11)}${frontier}${ticket.name}${evidence}`;
}

export function printBacklogList(
  rows: (Backlog & { tickets_total?: number; tickets_done?: number })[],
): void {
  for (const b of rows) {
    const progress =
      b.tickets_total !== undefined ? ` ${b.tickets_done}/${b.tickets_total} ticket` : '';
    console.log(`${b.id}  ${b.brd_id}  SP ${b.sp ?? '-'}${progress}  ${b.task_name}`);
  }
}

export function printBrdList(rows: Brd[]): void {
  for (const b of rows) console.log(`${b.id}  ${b.title}`);
}

export function printBacklogContext(ctx: BacklogContext): void {
  const done = ctx.tickets.filter((t) => t.status === 'done').length;
  console.log(`BACKLOG ${ctx.backlog.id} · ${ctx.brd.id} (${ctx.brd.title})`);
  console.log(`Nama     : ${ctx.backlog.task_name}`);
  console.log(`Module   : ${ctx.backlog.module}`);
  console.log(`Usecase  : ${ctx.backlog.usecase}`);
  console.log(`SP       : ${ctx.backlog.sp ?? '-'} · progres ${done}/${ctx.tickets.length} ticket`);
  console.log(`Figma    : ${ctx.backlog.figma || '-'}`);
  console.log(`\nAC :\n${ctx.backlog.ac || '-'}`);
  console.log(`\nDoD :\n${ctx.backlog.dod || '-'}`);
  if (ctx.backlog.notes) console.log(`\nNotes :\n${ctx.backlog.notes}`);
  console.log('\nTicket:');
  for (const t of ctx.tickets) console.log(`  ${ticketLine(t)}`);
  console.log(
    `\nUbah field : node tracker/cli.mjs backlog update ${ctx.backlog.id} --ac "..." --dod "..."`,
  );
  console.log(`Konteks JSON: node tracker/cli.mjs show ${ctx.backlog.id} --json`);
  console.log(`\nCatatan: ${DETAILING_RULE}`);
}

export function printTicketContext(ctx: TicketContext): void {
  console.log(
    `TICKET ${ctx.ticket.id} · T${ctx.ticket.seq}/${ctx.siblings.length} · ${ctx.backlog.id} (${ctx.brd.id})`,
  );
  console.log(`Nama      : ${ctx.ticket.name}`);
  console.log(
    `Status    : ${STATUS_LABEL[ctx.ticket.status]}${ctx.ticket.is_frontier ? ' · frontier' : ''}`,
  );
  console.log(`Assignee  : ${ctx.ticket.assignee} · Sprint: ${ctx.ticket.sprint}`);
  console.log(`Diperbarui: ${ctx.ticket.updated_at}`);
  console.log(`Evidence  : ${ctx.ticket.evidence || '-'}`);
  console.log(`\nBacklog   : ${ctx.backlog.task_name}`);
  console.log(`AC        : ${ctx.backlog.ac || '-'}`);
  console.log(`DoD       : ${ctx.backlog.dod || '-'}`);
  console.log('\nAlur ticket:');
  for (const s of ctx.siblings) {
    const mark = s.id === ctx.ticket.id ? '>' : ' ';
    console.log(` ${mark} ${ticketLine(s)}`);
  }
  console.log(`\nUbah status: ${ctx.cli.setStatus}`);
  console.log(
    `Ubah field : node tracker/cli.mjs ticket update ${ctx.ticket.id} --name "..." --assignee ... --sprint ...`,
  );
  console.log(`\nCatatan: ${DETAILING_RULE}`);
}

export function printStats(stats: StatsSummary): void {
  const parts = (Object.keys(STATUS_LABEL) as Status[]).map(
    (s) => `${STATUS_LABEL[s]}: ${stats.counts[s] ?? 0}`,
  );
  console.log(parts.join(' · '));
  console.log(
    `BR: ${stats.brds} · Backlog: ${stats.backlogs} · Ticket: ${stats.tickets} · SP: ${stats.spTotal}`,
  );
}

export function printFrontier(rows: Ticket[]): void {
  if (!rows.length) return console.log('tidak ada ticket di frontier (semua berjalan/selesai)');
  for (const t of rows) console.log(`${t.id}  T${t.seq}  ${t.name}`);
}
