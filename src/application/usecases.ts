// Use case: tulis/mutasi. Menerima port, tidak tahu implementasinya (clean architecture).
import {
  assertStatus,
  markFrontier,
  nextStatus,
  requiresEvidence,
  type Backlog,
  type Brd,
  type Status,
  type Ticket,
} from '../domain/entities';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors';
import type {
  BacklogPatch,
  SeedParser,
  SeedSummary,
  SnapshotRenderer,
  TicketPatch,
  TrackerRepository,
} from './ports';

const STATUS_MACHINE = 'todo -> in_progress -> in_review -> done';

function requireBacklog(repo: TrackerRepository, id: string): Backlog {
  const backlog = repo.getBacklog(id);
  if (!backlog) throw new NotFoundError(`backlog tidak ditemukan: ${id}`);
  return backlog;
}

function requireTicket(repo: TrackerRepository, id: string): Ticket {
  const ticket = repo.getTicket(id);
  if (!ticket) throw new NotFoundError(`ticket tidak ditemukan: ${id}`);
  return ticket;
}

// ---------- Ticket: status ----------
export class ChangeTicketStatus {
  constructor(
    private readonly repo: TrackerRepository,
    private readonly render: SnapshotRenderer,
  ) {}

  execute(
    id: string,
    statusRaw: string,
    evidence?: string | null,
  ): { before: Status; after: Status } {
    const after = assertStatus(statusRaw);
    const ticket = requireTicket(this.repo, id);
    const before = ticket.status;

    if (after !== before && after !== nextStatus(before)) {
      throw new ValidationError(
        `lompatan status ${before} -> ${after} tidak sah (status machine: ${STATUS_MACHINE})`,
      );
    }
    if (requiresEvidence(after)) {
      const evidenceText = evidence ?? ticket.evidence;
      if (!evidenceText) {
        throw new ValidationError(
          `${after} butuh bukti verifikasi: sertakan --evidence "<perintah + hasil / hash commit>"`,
        );
      }
    }
    this.repo.setTicketStatus(id, after, evidence ?? null);
    this.render.render();
    return { before, after };
  }
}

// ---------- Ticket: CRUD ----------
export class CreateTicket {
  constructor(private readonly repo: TrackerRepository) {}

  execute(
    backlogId: string,
    input: { name: string; assignee?: string; sprint?: string; seq?: number },
  ): Ticket {
    requireBacklog(this.repo, backlogId);
    if (!input.name?.trim()) throw new ValidationError('nama ticket wajib (--name)');
    if (input.seq !== undefined) {
      const taken = this.repo.listTicketsByBacklog(backlogId).some((t) => t.seq === input.seq);
      if (taken) throw new ConflictError(`seq ${input.seq} sudah terpakai di ${backlogId}`);
    }
    const id = this.repo.nextTicketId(backlogId);
    const seq = input.seq ?? Number(id.split('-T')[1]);
    return this.repo.createTicket({
      id,
      task_id: backlogId,
      seq,
      name: input.name.trim(),
      status: 'todo',
      assignee: input.assignee ?? 'TBD',
      sprint: input.sprint ?? 'Backlog',
      evidence: null,
      updated_at: '',
    });
  }
}

export class UpdateTicket {
  constructor(private readonly repo: TrackerRepository) {}

  execute(id: string, patch: TicketPatch): Ticket {
    requireTicket(this.repo, id);
    if (patch.seq !== undefined) {
      const ticket = requireTicket(this.repo, id);
      const clash = this.repo
        .listTicketsByBacklog(ticket.task_id)
        .some((t) => t.seq === patch.seq && t.id !== id);
      if (clash) throw new ConflictError(`seq ${patch.seq} sudah terpakai di ${ticket.task_id}`);
    }
    return this.repo.updateTicket(id, patch);
  }
}

export class DeleteTicket {
  constructor(private readonly repo: TrackerRepository) {}

  execute(id: string): void {
    requireTicket(this.repo, id);
    this.repo.deleteTicket(id);
  }
}

// ---------- Backlog: CRUD ----------
export class CreateBacklog {
  constructor(private readonly repo: TrackerRepository) {}

  execute(input: {
    brdId?: string;
    id?: string;
    name: string;
    usecase?: string;
    module?: string;
    sp?: number | null;
    figma?: string | null;
    ac?: string | null;
    dod?: string | null;
    notes?: string | null;
  }): Backlog {
    if (!input.name?.trim()) throw new ValidationError('nama backlog wajib (--name)');
    let brdId = input.brdId;
    if (!brdId) throw new ValidationError('backlog wajib terhubung ke BR (--brd <BR-ID>)');
    if (!this.repo.getBrd(brdId)) {
      throw new NotFoundError(`BR tidak ditemukan: ${brdId} (buat dulu: tracker brd add)`);
    }
    const taken = this.repo.listBacklogs().some((b) => b.brd_id === brdId);
    if (taken) throw new ConflictError(`BR ${brdId} sudah punya backlog (1 BR = 1 backlog)`);

    const id = input.id ?? this.repo.nextBacklogId();
    if (this.repo.getBacklog(id)) throw new ConflictError(`backlog sudah ada: ${id}`);

    const backlog: Backlog = {
      id,
      brd_id: brdId,
      usecase: input.usecase ?? brdId,
      module: input.module ?? 'TBD',
      task_name: input.name.trim(),
      figma: input.figma ?? null,
      sp: input.sp ?? null,
      ac: input.ac ?? null,
      dod: input.dod ?? null,
      notes: input.notes ?? null,
    };
    return this.repo.createBacklog(backlog);
  }
}

export class UpdateBacklog {
  constructor(private readonly repo: TrackerRepository) {}

  execute(id: string, patch: BacklogPatch): Backlog {
    requireBacklog(this.repo, id);
    if (patch.brd_id && !this.repo.getBrd(patch.brd_id)) {
      throw new NotFoundError(`BR tidak ditemukan: ${patch.brd_id}`);
    }
    return this.repo.updateBacklog(id, patch);
  }
}

export class DeleteBacklog {
  constructor(private readonly repo: TrackerRepository) {}

  execute(id: string, opts: { yes?: boolean } = {}): number {
    requireBacklog(this.repo, id);
    if (!opts.yes) {
      throw new ValidationError(
        'hapus backlog ikut menghapus semua ticket-nya — konfirmasi dengan --yes',
      );
    }
    const tickets = this.repo.listTicketsByBacklog(id);
    for (const ticket of tickets) this.repo.deleteTicket(ticket.id);
    this.repo.deleteBacklog(id);
    return tickets.length;
  }
}

// ---------- BR ----------
export class CreateBrd {
  constructor(private readonly repo: TrackerRepository) {}

  execute(input: { id?: string; title: string; description: string }): Brd {
    if (!input.title?.trim()) throw new ValidationError('judul BR wajib (--title)');
    if (!input.description?.trim()) throw new ValidationError('deskripsi BR wajib (--description)');
    const id = input.id ?? this.repo.nextBrdId();
    if (this.repo.getBrd(id)) throw new ConflictError(`BR sudah ada: ${id}`);
    return this.repo.createBrd({
      id,
      title: input.title.trim(),
      description: input.description.trim(),
    });
  }
}

// ---------- Baca (konteks agent) ----------
export interface BacklogContext {
  type: 'backlog';
  backlog: Backlog;
  brd: Brd;
  tickets: Ticket[];
}

export class GetBacklogContext {
  constructor(private readonly repo: TrackerRepository) {}

  execute(id: string): BacklogContext {
    const backlog = requireBacklog(this.repo, id);
    const brd = this.repo.getBrd(backlog.brd_id);
    if (!brd) throw new NotFoundError(`BR tidak ditemukan: ${backlog.brd_id}`);
    return { type: 'backlog', backlog, brd, tickets: this.repo.listTicketsByBacklog(id) };
  }
}

export class ListBacklogTickets {
  constructor(private readonly repo: TrackerRepository) {}

  execute(backlogId: string): Ticket[] {
    requireBacklog(this.repo, backlogId);
    return markFrontier(this.repo.listTicketsByBacklog(backlogId));
  }
}

export interface TicketContext {
  type: 'ticket';
  ticket: Ticket;
  backlog: Backlog;
  brd: Brd;
  siblings: Ticket[];
  cli: { setStatus: string; openBacklog: string };
}

export class GetTicketContext {
  constructor(private readonly repo: TrackerRepository) {}

  execute(id: string): TicketContext {
    const ticket = requireTicket(this.repo, id);
    const backlog = requireBacklog(this.repo, ticket.task_id);
    const brd = this.repo.getBrd(backlog.brd_id);
    if (!brd) throw new NotFoundError(`BR tidak ditemukan: ${backlog.brd_id}`);
    return {
      type: 'ticket',
      ticket,
      backlog,
      brd,
      siblings: this.repo.listTicketsByBacklog(ticket.task_id),
      cli: {
        setStatus: `node tracker/cli.mjs ticket status ${id} <status> --evidence "<bukti>"`,
        openBacklog: `node tracker/cli.mjs show ${ticket.task_id}`,
      },
    };
  }
}

export class ListFrontier {
  constructor(private readonly repo: TrackerRepository) {}

  execute(limit = 10): Ticket[] {
    const frontier = markFrontier(this.repo.listAllTickets()).filter(
      (t) => t.is_frontier && t.status === 'todo',
    );
    return frontier.slice(0, Math.max(1, limit));
  }
}

export interface StatsSummary {
  counts: Record<Status, number>;
  brds: number;
  backlogs: number;
  tickets: number;
  spTotal: number;
}

export class GetStats {
  constructor(private readonly repo: TrackerRepository) {}

  execute(): StatsSummary {
    const backlogs = this.repo.listBacklogs();
    return {
      counts: this.repo.countsByStatus(),
      brds: this.repo.listBrds().length,
      backlogs: backlogs.length,
      tickets: this.repo.listAllTickets().length,
      spTotal: backlogs.reduce((acc, b) => acc + (b.sp ?? 0), 0),
    };
  }
}

export class SyncSeed {
  constructor(
    private readonly repo: TrackerRepository,
    private readonly parser: SeedParser,
  ) {}

  execute(): SeedSummary {
    return this.repo.upsertSeed(this.parser.parse());
  }
}

export class RenderSnapshot {
  constructor(private readonly renderer: SnapshotRenderer) {}

  execute(): void {
    this.renderer.render();
  }
}

// ---------- Detailisasi hint (aturan AGENTS.md: grill-me + subagent) ----------
export const DETAILING_RULE =
  'Detailisasi field (AC/DoD/notes/deskripsi) wajib lewat skill grilling (grill-me) lalu spawn subagent — lihat AGENTS.md / skill project-tracker.';

// ---------- Baca (konteks agent) ----------
