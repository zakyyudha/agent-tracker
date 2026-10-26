// Tipe domain tracker — sinkron dengan tracker/schema.sql.
// Istilah: BR (brd), Backlog (task), Ticket (ticket) — lihat GLOSSARY.md.

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

export interface Task {
  id: string; // e.g. TASK-001 (Backlog)
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
  id: string; // e.g. TASK-001-T1 (Ticket)
  task_id: string;
  seq: number;
  name: string;
  status: Status;
  assignee: string;
  sprint: string;
  evidence: string | null;
  updated_at: string;
  is_frontier?: boolean;
}

export interface TicketWithRefs extends Ticket {
  task: Pick<Task, 'id' | 'task_name' | 'module' | 'sp' | 'brd_id'>;
  brd: Pick<Brd, 'id' | 'title'>;
}

export interface BoardStats {
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  total: number;
  tickets: number;
  tasks: number;
  brds: number;
  sp_total: number;
}

export interface BoardBr {
  id: string;
  title: string;
  description: string;
  task_ids: string[];
  tickets_total: number;
  tickets_done: number;
}

export interface BoardResponse {
  stats: BoardStats;
  brds: BoardBr[];
  tickets: TicketWithRefs[];
  sprints: string[];
  assignees: string[];
}

export interface BacklogResponse {
  task: Task;
  brd: Brd;
  tickets: Ticket[]; // is_frontier diisi
}

export interface TicketResponse {
  ticket: Ticket;
  siblings: Ticket[]; // seluruh tiket dalam task, terurut seq, is_frontier diisi
  task: Task;
  brd: Brd;
}
