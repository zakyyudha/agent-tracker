// Port: kontrak yang diimplementasi infrastructure layer (dependency inversion).
import type { Backlog, Brd, SeedData, Status, Ticket } from '../domain/entities';

export interface BacklogPatch {
  brd_id?: string;
  usecase?: string;
  module?: string;
  task_name?: string;
  figma?: string | null;
  sp?: number | null;
  ac?: string | null;
  dod?: string | null;
  notes?: string | null;
}

export interface TicketPatch {
  task_id?: string;
  seq?: number;
  name?: string;
  description?: string | null;
  assignee?: string;
  sprint?: string;
  evidence?: string | null;
}

export interface SeedSummary {
  brds: number;
  backlogs: number;
  ticketsAdded: number;
}

export interface TrackerRepository {
  listBrds(): Brd[];
  getBrd(id: string): Brd | null;
  createBrd(brd: Brd): Brd;

  listBacklogs(): Backlog[];
  getBacklog(id: string): Backlog | null;
  createBacklog(input: Backlog): Backlog;
  updateBacklog(id: string, patch: BacklogPatch): Backlog;
  deleteBacklog(id: string): void;

  listAllTickets(): Ticket[];
  listTicketsByBacklog(backlogId: string): Ticket[];
  getTicket(id: string): Ticket | null;
  createTicket(input: Ticket): Ticket;
  updateTicket(id: string, patch: TicketPatch): Ticket;
  deleteTicket(id: string): void;
  setTicketStatus(id: string, status: Status, evidence: string | null): void;

  nextBrdId(): string;
  nextBacklogId(): string;
  nextTicketId(backlogId: string): string;

  countsByStatus(): Record<Status, number>;
  upsertSeed(seed: SeedData): SeedSummary;
}

export interface SeedParser {
  parse(): SeedData;
}

export interface SnapshotRenderer {
  render(): void;
}

/** Clock terpisah agar use case mudah dites; infrastruktur memakai waktu nyata. */
export interface Clock {
  now(): string;
}
