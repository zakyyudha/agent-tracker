// Infrastructure: parser seed docs/*.md -> SeedData (satu arah, docs tidak pernah ditulis balik).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Backlog, Brd, SeedData } from '../../domain/entities';
import { ValidationError } from '../../domain/errors';
import type { SeedParser } from '../../application/ports';

function parseMdTable(file: string): string[][] {
  const rows: string[][] = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // baris separator
    rows.push(cells);
  }
  return rows;
}

const col = (header: string[], re: RegExp): number => header.findIndex((c) => re.test(c));

export class MarkdownSeedParser implements SeedParser {
  constructor(private readonly repoRoot: string) {}

  parse(): SeedData {
    const brdRows = parseMdTable(path.join(this.repoRoot, 'docs/brd-point.md'));
    const hB = brdRows[0];
    const iBid = col(hB, /ID/);
    const iTitle = col(hB, /Business Requirement/i);
    const iDesc = col(hB, /Deskripsi/i);
    if (iBid < 0 || iTitle < 0 || iDesc < 0)
      throw new ValidationError('brd-point.md: kolom tidak dikenali');

    const backlogRows = parseMdTable(path.join(this.repoRoot, 'docs/backlog.md'));
    const hT = backlogRows[0];
    const idx = {
      id: col(hT, /Task ID/i),
      usecase: col(hT, /USECASE/i),
      brd: col(hT, /BRD Reference/i),
      module: col(hT, /Module/i),
      name: col(hT, /Task Name/i),
      sub: col(hT, /Sub-Task/i),
      figma: col(hT, /Figma/i),
      ac: col(hT, /Acceptance/i),
      dod: col(hT, /Definition of Done/i),
      sp: col(hT, /Complexity/i),
      notes: col(hT, /Notes/i),
    };
    if (idx.id < 0 || idx.sub < 0 || idx.brd < 0)
      throw new ValidationError('backlog.md: kolom tidak dikenali');

    const brds: Brd[] = brdRows.slice(1).map((r) => ({
      id: r[iBid],
      title: r[iTitle],
      description: r[iDesc],
    }));

    const backlogs: Backlog[] = [];
    const tickets: SeedData['tickets'] = [];
    for (const r of backlogRows.slice(1)) {
      const id = r[idx.id];
      backlogs.push({
        id,
        brd_id: r[idx.brd],
        usecase: r[idx.usecase],
        module: r[idx.module],
        task_name: r[idx.name],
        figma: r[idx.figma] ?? null,
        sp: Number.parseInt(r[idx.sp], 10) || null,
        ac: r[idx.ac] ?? null,
        dod: r[idx.dod] ?? null,
        notes: r[idx.notes] || null,
      });
      (r[idx.sub] || '')
        .split(/,\s+/)
        .filter(Boolean)
        .forEach((name, i) =>
          tickets.push({ id: `${id}-T${i + 1}`, taskId: id, seq: i + 1, name }),
        );
    }

    return { brds, backlogs, tickets };
  }
}
