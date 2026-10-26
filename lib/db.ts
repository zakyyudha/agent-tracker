// Akses read-only ke tracker/kanban.db. Writer satu-satunya: tracker/cli.mjs (lihat AGENTS.md).
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import type {
  BacklogResponse,
  BoardBr,
  BoardResponse,
  Brd,
  Status,
  Task,
  Ticket,
  TicketResponse,
} from './types';
import { STATUSES } from './types';

// App dijalankan dengan cwd = tracker/ (next dev / next start / tsx snapshot).
export const DB_PATH = process.env.TRACKER_DB ?? path.resolve(process.cwd(), 'kanban.db');

let db: DatabaseSync | null = null;
function openDb(): DatabaseSync {
  db ??= new DatabaseSync(DB_PATH, { readOnly: true });
  return db;
}

const STATUSES_SQL = STATUSES.join(',');

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
const TICKET_COLS_T =
  't.id, t.task_id, t.seq, t.name, t.status, t.assignee, t.sprint, t.evidence, t.updated_at';

function markFrontier<T extends TicketRow>(rows: T[]): (T & { is_frontier?: boolean })[] {
  const byTask = new Map<string, T[]>();
  for (const r of rows) {
    if (!byTask.has(r.task_id)) byTask.set(r.task_id, []);
    byTask.get(r.task_id)!.push(r);
  }
  const out = new Map(rows.map((r) => [r.id, { ...r } as T & { is_frontier?: boolean }]));
  for (const group of byTask.values()) {
    let blocked = false;
    for (const t of [...group].sort((a, b) => a.seq - b.seq)) {
      const row = out.get(t.id)!;
      row.is_frontier = t.status === 'todo' && !blocked;
      if (t.status !== 'done') blocked = true;
    }
  }
  return [...out.values()];
}

export interface BoardFilters {
  status?: string[]; // subset of Status
  q?: string;
  brd?: string;
  sprint?: string;
  assignee?: string;
}

export function getBoard(filters: BoardFilters = {}): BoardResponse {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filters.status?.length) {
    const valid = filters.status.filter((s): s is Status => STATUSES.includes(s as Status));
    if (valid.length) {
      where.push(`t.status IN (${valid.map(() => '?').join(',')})`);
      params.push(...valid);
    }
  }
  if (filters.q) {
    const like = `%${filters.q}%`;
    where.push(
      `(t.id LIKE ? OR t.name LIKE ? OR k.id LIKE ? OR k.task_name LIKE ? OR b.id LIKE ? OR b.title LIKE ?)`,
    );
    params.push(like, like, like, like, like, like);
  }
  if (filters.brd) {
    where.push(`b.id = ?`);
    params.push(filters.brd);
  }
  if (filters.sprint) {
    where.push(`t.sprint = ?`);
    params.push(filters.sprint);
  }
  if (filters.assignee) {
    where.push(`t.assignee = ?`);
    params.push(filters.assignee);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = openDb()
    .prepare(
      `SELECT ${TICKET_COLS_T} FROM ticket t
       JOIN task k ON k.id = t.task_id
       JOIN brd b ON b.id = k.brd_id
       ${whereSql} ORDER BY k.id, t.seq`,
    )
    .all(...params) as unknown as TicketRow[];

  const ticketsAll = openDb()
    .prepare(`SELECT ${TICKET_COLS} FROM ticket`)
    .all() as unknown as TicketRow[];
  const tasks = openDb().prepare('SELECT * FROM task').all() as unknown as Task[];
  const brds = openDb().prepare('SELECT * FROM brd ORDER BY id').all() as unknown as Brd[];

  const stat = Object.fromEntries(
    STATUSES.map((s) => [s, ticketsAll.filter((t) => t.status === s).length]),
  );
  const tasksById = new Map(tasks.map((t) => [t.id, t]));
  const brdsById = new Map(brds.map((b) => [b.id, b]));

  // Terapkan is_frontier pada subset hasil filter (konteks per task dalam subset).
  const filtered = rows.map((r) => ({
    id: r.id,
    task_id: r.task_id,
    seq: r.seq,
    name: r.name,
    status: r.status,
    assignee: r.assignee,
    sprint: r.sprint,
    evidence: r.evidence,
    updated_at: r.updated_at,
  }));
  const withFrontier = markFrontier(filtered);

  const brBoard: BoardBr[] = brds.map((b) => {
    const taskIds = tasks.filter((k) => k.brd_id === b.id).map((k) => k.id);
    const tickets = ticketsAll.filter((t) => taskIds.includes(t.task_id));
    return {
      id: b.id,
      title: b.title,
      description: b.description,
      task_ids: taskIds,
      tickets_total: tickets.length,
      tickets_done: tickets.filter((t) => t.status === 'done').length,
    };
  });

  return {
    stats: {
      todo: stat.todo,
      in_progress: stat.in_progress,
      in_review: stat.in_review,
      done: stat.done,
      total: ticketsAll.length,
      tickets: ticketsAll.length,
      tasks: tasks.length,
      brds: brds.length,
      sp_total: tasks.reduce((a, t) => a + (t.sp ?? 0), 0),
    },
    brds: brBoard,
    tickets: withFrontier.map((t) => ({
      ...t,
      task: {
        id: t.task_id,
        task_name: tasksById.get(t.task_id)?.task_name ?? '',
        module: tasksById.get(t.task_id)?.module ?? '',
        sp: tasksById.get(t.task_id)?.sp ?? null,
        brd_id: tasksById.get(t.task_id)?.brd_id ?? '',
      },
      brd: {
        id: brdsById.get(tasksById.get(t.task_id)?.brd_id ?? '')?.id ?? '',
        title: brdsById.get(tasksById.get(t.task_id)?.brd_id ?? '')?.title ?? '',
      },
    })),
    sprints: [...new Set(ticketsAll.map((t) => t.sprint))].sort(),
    assignees: [...new Set(ticketsAll.map((t) => t.assignee))].sort(),
  };
}

export function getBacklog(id: string): BacklogResponse | null {
  const task = openDb().prepare('SELECT * FROM task WHERE id = ?').get(id) as unknown as
    Task | undefined;
  if (!task) return null;
  const brd = openDb().prepare('SELECT * FROM brd WHERE id = ?').get(task.brd_id) as unknown as Brd;
  const rows = openDb()
    .prepare(`SELECT ${TICKET_COLS} FROM ticket WHERE task_id = ? ORDER BY seq`)
    .all(id) as unknown as TicketRow[];
  return { task, brd, tickets: markFrontier(rows) };
}

export function getTicket(id: string): TicketResponse | null {
  const ticket = openDb().prepare(`SELECT ${TICKET_COLS} FROM ticket WHERE id = ?`).get(id) as
    TicketRow | undefined;
  if (!ticket) return null;
  const task = openDb()
    .prepare('SELECT * FROM task WHERE id = ?')
    .get(ticket.task_id) as unknown as Task;
  const brd = openDb().prepare('SELECT * FROM brd WHERE id = ?').get(task.brd_id) as unknown as Brd;
  const rows = openDb()
    .prepare(`SELECT ${TICKET_COLS} FROM ticket WHERE task_id = ? ORDER BY seq`)
    .all(ticket.task_id) as unknown as TicketRow[];
  return { ticket, siblings: markFrontier(rows), task, brd };
}
