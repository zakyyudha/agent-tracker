#!/usr/bin/env node
// Agent Tracker CLI (clean architecture: domain -> application -> infrastructure -> presentation)
// Composition root & command definitions (commander).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { STATUS_LABEL, type Backlog } from '../domain/entities';
import { toCliMessage } from '../domain/errors';
import {
  ChangeTicketStatus,
  CreateBacklog,
  CreateBrd,
  CreateTicket,
  DeleteBacklog,
  DeleteTicket,
  GetBacklogContext,
  GetStats,
  GetTicketContext,
  ListBacklogTickets,
  ListFrontier,
  RenderSnapshot,
  SyncSeed,
  UpdateBacklog,
  UpdateTicket,
} from '../application/usecases';
import type { SeedParser, SnapshotRenderer, TrackerRepository } from '../application/ports';
import { MarkdownSeedParser } from '../infrastructure/seed/markdown-seed-parser';
import { SqliteTrackerRepository } from '../infrastructure/sqlite/tracker-sqlite-repository';
import { DB_PATH, PnpmSnapshotRenderer, REPO_ROOT, SCHEMA_PATH } from '../infrastructure/config';
import {
  json,
  printBacklogContext,
  printBacklogList,
  printBrdList,
  printFrontier,
  printStats,
  printTicketContext,
  ticketLine,
} from './format';

// ---------- komposisi dependency (composition root) ----------
const repo: TrackerRepository = new SqliteTrackerRepository(DB_PATH, SCHEMA_PATH);
const seedParser: SeedParser = new MarkdownSeedParser(REPO_ROOT);
const renderer: SnapshotRenderer = new PnpmSnapshotRenderer();

const showBacklog = new GetBacklogContext(repo);
const showTicket = new GetTicketContext(repo);
const setStatus = new ChangeTicketStatus(repo, renderer);

/** --ac "inline" atau --ac-file path (untuk konten markdown panjang dari agent). */
const readText = (inline?: string, file?: string): string | undefined => {
  if (inline !== undefined) return inline;
  if (file !== undefined) {
    const resolved = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    if (!existsSync(resolved)) {
      throw new Error(`Berkas tidak ditemukan: ${file} (jalur dicari: ${resolved})`);
    }
    return readFileSync(resolved, 'utf8');
  }
  return undefined;
};

// --json boleh di posisi mana pun (sebelum/sesudah subcommand).
const JSON_MODE = process.argv.includes('--json');
const argv = process.argv.filter((arg) => arg !== '--json');
const asJson = (): boolean => JSON_MODE;

const program = new Command();
program
  .name('tracker')
  .description('Agent Tracker — CLI (single database writer)')
  .version('0.2.2');

// ---------- perintah inti ----------
program
  .command('sync')
  .description('docs -> kanban.db (idempotent, status Ticket dipertahankan)')
  .action(() => {
    const summary = new SyncSeed(repo, seedParser).execute();
    console.log(
      `sync OK: brd=${summary.brds} task=${summary.backlogs} ticket_ditambahkan=${summary.ticketsAdded}`,
    );
  });

program
  .command('render')
  .description('DB -> tracker/index.html (snapshot statis)')
  .action(() => {
    new RenderSnapshot(renderer).execute();
    console.log('render OK: tracker/index.html');
  });

program
  .command('next')
  .description('frontier: Ticket todo yang bebannya selesai')
  .argument('[limit]', 'jumlah maksimal', '10')
  .action((limit: string) => {
    printFrontier(new ListFrontier(repo).execute(Number(limit) || 10));
  });

program
  .command('stats')
  .description('rekap per status')
  .action(() => printStats(new GetStats(repo).execute()));

program
  .command('show')
  .description('konteks lengkap satu backlog / ticket')
  .argument('<id>')
  .action((id: string) => {
    if (/-T\d+$/.test(id)) {
      const ctx = showTicket.execute(id);
      asJson() ? json(ctx) : printTicketContext(ctx);
      return;
    }
    const ctx = showBacklog.execute(id);
    asJson() ? json(ctx) : printBacklogContext(ctx);
  });

program
  .command('status')
  .description('ubah status ticket (kompatibilitas: sama dengan ticket status)')
  .argument('<id>')
  .argument('<status>')
  .option('--evidence <text>', 'bukti verifikasi (wajib untuk in_review/done)')
  .action((id: string, status: string, opts: { evidence?: string }) => {
    const result = setStatus.execute(id, status, opts.evidence ?? null);
    console.log(`status OK: ${id} ${STATUS_LABEL[result.before]} -> ${STATUS_LABEL[result.after]}`);
  });

// ---------- grup backlog ----------
const backlog = program.command('backlog').description('CRUD backlog (tabel task)');

backlog
  .command('list')
  .description('daftar semua backlog')
  .action(() => {
    const rows = repo.listBacklogs().map((b) => {
      const tickets = repo.listTicketsByBacklog(b.id);
      return {
        ...b,
        tickets_total: tickets.length,
        tickets_done: tickets.filter((t) => t.status === 'done').length,
      };
    });
    asJson() ? json(rows) : printBacklogList(rows);
  });

backlog
  .command('show')
  .description('konteks satu backlog')
  .argument('<id>')
  .action((id: string) => {
    const ctx = showBacklog.execute(id);
    asJson() ? json(ctx) : printBacklogContext(ctx);
  });

backlog
  .command('add')
  .description('tambah backlog baru (wajib terhubung ke BR yang ada)')
  .requiredOption('--brd <id>', 'BR induk')
  .requiredOption('--name <text>', 'nama backlog (task_name)')
  .option('--usecase <text>', 'use case')
  .option('--module <text>', 'module')
  .option('--sp <number>', 'story points')
  .option('--figma <url>', 'link figma')
  .option('--ac <text>', 'acceptance criteria')
  .option('--ac-file <path>', 'acceptance criteria dari file markdown')
  .option('--dod <text>', 'definition of done')
  .option('--dod-file <path>', 'definition of done dari file markdown')
  .option('--notes <text>', 'notes')
  .option('--notes-file <path>', 'notes dari file markdown')
  .option('--id <id>', 'id backlog manual (default: auto)')
  .action((opts) => {
    const created = new CreateBacklog(repo).execute({
      brdId: opts.brd,
      id: opts.id,
      name: opts.name,
      usecase: opts.usecase,
      module: opts.module,
      sp: opts.sp ? Number(opts.sp) : null,
      figma: opts.figma,
      ac: readText(opts.ac, opts.acFile),
      dod: readText(opts.dod, opts.dodFile),
      notes: readText(opts.notes, opts.notesFile),
    });
    console.log(`backlog OK: ${created.id} (${created.brd_id})`);
    if (!asJson()) printBacklogContext(showBacklog.execute(created.id));
  });

backlog
  .command('update')
  .description('update field backlog (hanya flag yang dikirim)')
  .argument('<id>')
  .option('--brd <id>', 'BR induk baru')
  .option('--name <text>', 'task_name')
  .option('--usecase <text>', 'use case')
  .option('--module <text>', 'module')
  .option('--sp <number>', 'story points')
  .option('--figma <url>', 'link figma')
  .option('--ac <text>', 'acceptance criteria')
  .option('--ac-file <path>', 'acceptance criteria dari file')
  .option('--dod <text>', 'definition of done')
  .option('--dod-file <path>', 'definition of done dari file')
  .option('--notes <text>', 'notes')
  .option('--notes-file <path>', 'notes dari file')
  .action((id: string, opts) => {
    const patch: Partial<Backlog> = {};
    const map: [keyof Backlog, unknown][] = [
      ['brd_id', opts.brd],
      ['task_name', opts.name],
      ['usecase', opts.usecase],
      ['module', opts.module],
      ['sp', opts.sp !== undefined ? Number(opts.sp) : undefined],
      ['figma', opts.figma],
      ['ac', readText(opts.ac, opts.acFile)],
      ['dod', readText(opts.dod, opts.dodFile)],
      ['notes', readText(opts.notes, opts.notesFile)],
    ];
    for (const [key, value] of map)
      if (value !== undefined) (patch as Record<string, unknown>)[key] = value;
    const updated = new UpdateBacklog(repo).execute(id, patch);
    console.log(`backlog OK: ${updated.id} (field: ${Object.keys(patch).join(', ') || '-'})`);
  });

backlog
  .command('delete')
  .description('hapus backlog + seluruh ticket-nya (wajib --yes)')
  .argument('<id>')
  .option('--yes', 'konfirmasi hapus', false)
  .action((id: string, opts: { yes: boolean }) => {
    const removed = new DeleteBacklog(repo).execute(id, opts);
    console.log(`backlog OK: ${id} dihapus (${removed} ticket ikut terhapus)`);
  });

// ---------- grup ticket ----------
const ticket = program.command('ticket').description('CRUD ticket (tabel ticket)');

ticket
  .command('list')
  .description('daftar ticket satu backlog')
  .argument('<backlogId>')
  .action((backlogId: string) => {
    const rows = new ListBacklogTickets(repo).execute(backlogId);
    asJson() ? json(rows) : rows.forEach((t) => console.log(ticketLine(t)));
  });

ticket
  .command('show')
  .description('konteks satu ticket')
  .argument('<id>')
  .action((id: string) => {
    const ctx = showTicket.execute(id);
    asJson() ? json(ctx) : printTicketContext(ctx);
  });

ticket
  .command('add')
  .description('tambah ticket ke backlog (id & seq otomatis di akhir)')
  .argument('<backlogId>')
  .requiredOption('--name <text>', 'nama ticket')
  .option('--desc <text>', 'deskripsi / spesifikasi lingkup kerja ticket')
  .option('--desc-file <path>', 'deskripsi ticket dari file markdown')
  .option('--assignee <text>', 'assignee', 'TBD')
  .option('--sprint <text>', 'sprint', 'Backlog')
  .option('--seq <number>', 'posisi seq manual')
  .action((backlogId: string, opts) => {
    const created = new CreateTicket(repo).execute(backlogId, {
      name: opts.name,
      description: readText(opts.desc, opts.descFile),
      assignee: opts.assignee,
      sprint: opts.sprint,
      seq: opts.seq ? Number(opts.seq) : undefined,
    });
    console.log(`ticket OK: ${created.id} (T${created.seq})`);
  });

ticket
  .command('update')
  .description('update field ticket')
  .argument('<id>')
  .option('--name <text>', 'nama')
  .option('--desc <text>', 'deskripsi / spesifikasi lingkup kerja ticket')
  .option('--desc-file <path>', 'deskripsi ticket dari file markdown')
  .option('--assignee <text>', 'assignee')
  .option('--sprint <text>', 'sprint')
  .option('--evidence <text>', 'evidence verifikasi')
  .option('--seq <number>', 'posisi seq')
  .action((id: string, opts) => {
    const patch: Record<string, unknown> = {};
    const desc = readText(opts.desc, opts.descFile);
    const map: [string, unknown][] = [
      ['name', opts.name],
      ['description', desc],
      ['assignee', opts.assignee],
      ['sprint', opts.sprint],
      ['evidence', opts.evidence],
      ['seq', opts.seq !== undefined ? Number(opts.seq) : undefined],
    ];
    for (const [key, value] of map) if (value !== undefined) patch[key] = value;
    const updated = new UpdateTicket(repo).execute(id, patch);
    console.log(`ticket OK: ${updated.id} (field: ${Object.keys(patch).join(', ') || '-'})`);
  });

ticket
  .command('delete')
  .description('hapus ticket (wajib --yes)')
  .argument('<id>')
  .option('--yes', 'konfirmasi hapus', false)
  .action((id: string, opts: { yes: boolean }) => {
    if (!opts.yes) throw new Error('hapus ticket permanen — konfirmasi dengan --yes');
    new DeleteTicket(repo).execute(id);
    console.log(`ticket OK: ${id} dihapus`);
  });

ticket
  .command('status')
  .description('ubah status ticket (status machine: todo -> in_progress -> in_review -> done)')
  .argument('<id>')
  .argument('<status>')
  .option('--evidence <text>', 'bukti verifikasi (wajib untuk in_review/done)')
  .action((id: string, status: string, opts: { evidence?: string }) => {
    const result = setStatus.execute(id, status, opts.evidence ?? null);
    console.log(`status OK: ${id} ${result.before} -> ${result.after}`);
  });

// ---------- grup brd ----------
const brd = program.command('brd').description('CRUD business requirement');

brd
  .command('list')
  .description('daftar BR')
  .action(() => {
    const rows = repo.listBrds();
    asJson() ? json(rows) : printBrdList(rows);
  });

brd
  .command('add')
  .description('tambah BR (id auto bila kosong)')
  .option('--id <id>', 'id BR manual')
  .requiredOption('--title <text>', 'judul BR')
  .requiredOption('--description <text>', 'deskripsi BR')
  .action((opts) => {
    const created = new CreateBrd(repo).execute({
      id: opts.id,
      title: opts.title,
      description: opts.description,
    });
    console.log(`brd OK: ${created.id}`);
  });

program.parseAsync(argv).catch((error: unknown) => {
  console.error(toCliMessage(error).message);
  process.exitCode = 1;
});
