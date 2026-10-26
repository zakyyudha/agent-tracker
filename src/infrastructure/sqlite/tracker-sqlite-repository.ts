// Infrastructure: baca/tulis tracker/kanban.db (node:sqlite). Satu-satunya adaptor SQLite.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import {
  STATUSES,
  STATUS_LABEL,
  type Backlog,
  type Brd,
  type SeedData,
  type Status,
  type Ticket,
} from '../../domain/entities';
import { ConflictError, NotFoundError } from '../../domain/errors';
import type {
  BacklogPatch,
  SeedSummary,
  TicketPatch,
  TrackerRepository,
} from '../../application/ports';

interface TicketRow {
  id: string;
  task_id: string;
  seq: number;
  name: string;
  status: Status;
  assignee: string;
  sprint: string;
  evidence: string | null;
  updated_at: string;
}

const TICKET_COLS = 'id, task_id, seq, name, status, assignee, sprint, evidence, updated_at';

export class SqliteTrackerRepository implements TrackerRepository {
  private readonly db: DatabaseSync;

  constructor(
    private readonly dbPath: string,
    schemaPath: string,
  ) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(readFileSync(schemaPath, 'utf8'));
    this.ensureColumns();
  }

  /** Migrasi ringan untuk DB lama (sebelum kolom evidence ditambahkan ke schema.sql). */
  private ensureColumns() {
    const cols = (this.db.prepare('PRAGMA table_info(ticket)').all() as { name: string }[]).map(
      (c) => c.name,
    );
    if (!cols.includes('evidence')) this.db.exec('ALTER TABLE ticket ADD COLUMN evidence TEXT');
  }

  // ---------- BR ----------
  listBrds(): Brd[] {
    return this.db.prepare('SELECT * FROM brd ORDER BY id').all() as unknown as Brd[];
  }

  getBrd(id: string): Brd | null {
    return (this.db.prepare('SELECT * FROM brd WHERE id = ?').get(id) as unknown as Brd) ?? null;
  }

  createBrd(brd: Brd): Brd {
    this.db
      .prepare('INSERT INTO brd (id, title, description) VALUES (?,?,?)')
      .run(brd.id, brd.title, brd.description);
    return brd;
  }

  // ---------- Backlog (tabel task) ----------
  listBacklogs(): Backlog[] {
    return this.db.prepare('SELECT * FROM task ORDER BY id').all() as unknown as Backlog[];
  }

  getBacklog(id: string): Backlog | null {
    return (
      (this.db.prepare('SELECT * FROM task WHERE id = ?').get(id) as unknown as Backlog) ?? null
    );
  }

  createBacklog(input: Backlog): Backlog {
    this.db
      .prepare(
        `INSERT INTO task (id, brd_id, usecase, module, task_name, figma, sp, ac, dod, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        input.id,
        input.brd_id,
        input.usecase,
        input.module,
        input.task_name,
        input.figma,
        input.sp,
        input.ac,
        input.dod,
        input.notes,
      );
    return input;
  }

  updateBacklog(id: string, patch: BacklogPatch): Backlog {
    const current = this.getBacklog(id);
    if (!current) throw new NotFoundError(`backlog tidak ditemukan: ${id}`);
    const next = { ...current, ...patch };
    this.db
      .prepare(
        `UPDATE task SET brd_id=?, usecase=?, module=?, task_name=?, figma=?, sp=?, ac=?, dod=?, notes=?
         WHERE id=?`,
      )
      .run(
        next.brd_id,
        next.usecase,
        next.module,
        next.task_name,
        next.figma,
        next.sp,
        next.ac,
        next.dod,
        next.notes,
        id,
      );
    return next;
  }

  deleteBacklog(id: string): void {
    const res = this.db.prepare('DELETE FROM task WHERE id=?').run(id);
    if (Number(res.changes) === 0) throw new NotFoundError(`backlog tidak ditemukan: ${id}`);
  }

  // ---------- Ticket ----------
  listAllTickets(): Ticket[] {
    return this.db
      .prepare(`SELECT ${TICKET_COLS} FROM ticket ORDER BY task_id, seq`)
      .all() as unknown as Ticket[];
  }

  listTicketsByBacklog(backlogId: string): Ticket[] {
    return this.db
      .prepare(`SELECT ${TICKET_COLS} FROM ticket WHERE task_id=? ORDER BY seq`)
      .all(backlogId) as unknown as Ticket[];
  }

  getTicket(id: string): Ticket | null {
    return (
      (this.db
        .prepare(`SELECT ${TICKET_COLS} FROM ticket WHERE id=?`)
        .get(id) as unknown as Ticket) ?? null
    );
  }

  createTicket(input: Ticket): Ticket {
    this.db
      .prepare(
        `INSERT INTO ticket (id, task_id, seq, name, status, assignee, sprint, evidence)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(
        input.id,
        input.task_id,
        input.seq,
        input.name,
        input.status,
        input.assignee,
        input.sprint,
        input.evidence,
      );
    return this.getTicket(input.id)!;
  }

  updateTicket(id: string, patch: TicketPatch): Ticket {
    const current = this.getTicket(id);
    if (!current) throw new NotFoundError(`ticket tidak ditemukan: ${id}`);
    const next = { ...current, ...patch };
    this.db
      .prepare(
        `UPDATE ticket SET task_id=?, seq=?, name=?, assignee=?, sprint=?, evidence=?, updated_at=datetime('now')
         WHERE id=?`,
      )
      .run(next.task_id, next.seq, next.name, next.assignee, next.sprint, next.evidence, id);
    return this.getTicket(id)!;
  }

  deleteTicket(id: string): void {
    const res = this.db.prepare('DELETE FROM ticket WHERE id=?').run(id);
    if (Number(res.changes) === 0) throw new NotFoundError(`ticket tidak ditemukan: ${id}`);
  }

  setTicketStatus(id: string, status: Status, evidence: string | null): void {
    const res = this.db
      .prepare(
        `UPDATE ticket SET status=?, evidence=COALESCE(?, evidence), updated_at=datetime('now') WHERE id=?`,
      )
      .run(status, evidence, id);
    if (Number(res.changes) === 0) throw new NotFoundError(`ticket tidak ditemukan: ${id}`);
  }

  // ---------- ID generator ----------
  nextBrdId(): string {
    const rows = this.db.prepare('SELECT id FROM brd').all() as { id: string }[];
    let prefix = 'BR-';
    let max = 0;
    for (const r of rows) {
      const m = r.id.match(/^(.*?)(\d+)$/);
      if (m) {
        prefix = m[1];
        max = Math.max(max, Number(m[2]));
      }
    }
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  nextBacklogId(): string {
    const rows = this.db.prepare('SELECT id FROM task').all() as { id: string }[];
    let prefix = 'TASK-';
    let max = 0;
    for (const r of rows) {
      const m = r.id.match(/^(.*?)(\d+)$/);
      if (m) {
        prefix = m[1];
        max = Math.max(max, Number(m[2]));
      }
    }
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  }

  nextTicketId(backlogId: string): string {
    const seqs = this.listTicketsByBacklog(backlogId).map((t) => t.seq);
    const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
    return `${backlogId}-T${next}`;
  }

  private nextNumber(sql: string, pattern: RegExp): string {
    const rows = this.db.prepare(sql).all() as { id: string }[];
    const max = rows.reduce((acc, row) => {
      const match = pattern.exec(row.id);
      return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);
    return String(max + 1).padStart(3, '0');
  }

  countsByStatus(): Record<Status, number> {
    const rows = this.db.prepare('SELECT status, COUNT(*) n FROM ticket GROUP BY status').all() as {
      status: Status;
      n: number;
    }[];
    const map = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>;
    return Object.fromEntries(STATUSES.map((s) => [s, map[s] ?? 0])) as Record<Status, number>;
  }

  // ---------- Seed (docs -> DB, idempotent) ----------
  upsertSeed(seed: SeedData): SeedSummary {
    this.db.exec('BEGIN');
    const stats = { brds: 0, backlogs: 0, ticketsAdded: 0 };
    try {
      const upsertBrd = this.db.prepare(
        `INSERT INTO brd (id, title, description) VALUES (?,?,?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description`,
      );
      for (const brd of seed.brds) {
        upsertBrd.run(brd.id, brd.title, brd.description);
        stats.brds++;
      }

      const upsertBacklog = this.db.prepare(
        `INSERT INTO task (id, brd_id, usecase, module, task_name, figma, sp, ac, dod, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET brd_id=excluded.brd_id, usecase=excluded.usecase,
           module=excluded.module, task_name=excluded.task_name, figma=excluded.figma, sp=excluded.sp,
           ac=excluded.ac, dod=excluded.dod, notes=excluded.notes`,
      );
      for (const b of seed.backlogs) {
        upsertBacklog.run(
          b.id,
          b.brd_id,
          b.usecase,
          b.module,
          b.task_name,
          b.figma,
          b.sp,
          b.ac,
          b.dod,
          b.notes,
        );
        stats.backlogs++;
      }

      const upsertTicket = this.db.prepare(
        `INSERT INTO ticket (id, task_id, seq, name) VALUES (?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name`,
      );
      for (const t of seed.tickets) {
        const res = upsertTicket.run(t.id, t.taskId, t.seq, t.name);
        if (Number(res.changes) > 0) stats.ticketsAdded++;
      }

      this.db.exec('COMMIT');
      return stats;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}
