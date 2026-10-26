// Domain: entitas & aturan murni (tanpa I/O). Istilah mengikuti GLOSSARY.md.

export const STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export interface Brd {
  id: string; // e.g. BR-001
  title: string;
  description: string;
}

export interface Backlog {
  id: string; // e.g. TASK-001 (task table)
  brd_id: string;
  usecase: string;
  module: string;
  task_name: string;
  figma: string | null;
  sp: number | null;
  ac: string | null;
  dod: string | null;
  notes: string | null;
}

export interface Ticket {
  id: string; // e.g. TASK-001-T1
  task_id: string;
  seq: number;
  name: string;
  description?: string | null;
  status: Status;
  assignee: string;
  sprint: string;
  evidence: string | null;
  updated_at: string;
  is_frontier?: boolean;
}

export interface SeedData {
  brds: Brd[];
  backlogs: Backlog[];
  tickets: { id: string; taskId: string; seq: number; name: string }[];
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

export function assertStatus(value: string): Status {
  if (!isStatus(value)) {
    throw new Error(`status tidak valid: ${value} (pilihan: ${STATUSES.join(' | ')})`);
  }
  return value;
}

/** Status berikutnya yang sah (status machine linier, tanpa lompatan). */
export function nextStatus(current: Status): Status | null {
  const i = STATUSES.indexOf(current);
  return STATUSES[i + 1] ?? null;
}

/** Evidence wajib untuk in_review & done (klaim selesai harus punya bukti nyata). */
export function requiresEvidence(status: Status): boolean {
  return status === 'in_review' || status === 'done';
}

/** Tandai Frontier: ticket todo yang seluruh ticket ber-seq lebih kecil sudah done. */
export function markFrontier<
  T extends { id: string; task_id: string; seq: number; status: Status },
>(rows: T[]): (T & { is_frontier?: boolean })[] {
  const byTask = new Map<string, T[]>();
  for (const row of rows) {
    const group = byTask.get(row.task_id) ?? [];
    group.push(row);
    byTask.set(row.task_id, group);
  }
  const out = new Map(rows.map((row) => [row.id, { ...row } as T & { is_frontier?: boolean }]));
  for (const group of byTask.values()) {
    let blocked = false;
    for (const ticket of [...group].sort((a, b) => a.seq - b.seq)) {
      const row = out.get(ticket.id)!;
      row.is_frontier = ticket.status === 'todo' && !blocked;
      if (ticket.status !== 'done') blocked = true;
    }
  }
  return [...out.values()];
}

/** Urutkan ticket dalam satu backlog berdasarkan seq. */
export function sortBySeq<T extends { seq: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.seq - b.seq);
}
