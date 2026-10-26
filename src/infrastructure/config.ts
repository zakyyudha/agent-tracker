// Infrastructure: konfigurasi path & adaptor snapshot.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { SnapshotRenderer } from '../application/ports';
import { TrackerError } from '../domain/errors';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function resolveTrackerDir(start: string): string {
  let cur = start;
  for (let i = 0; i < 4; i++) {
    if (existsSync(path.join(cur, 'schema.sql'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return path.resolve(start, '../..');
}

export const TRACKER_DIR = resolveTrackerDir(HERE);
export const REPO_ROOT = path.resolve(TRACKER_DIR, '..');
export const DB_PATH = process.env.TRACKER_DB ?? path.join(TRACKER_DIR, 'kanban.db');
export const SCHEMA_PATH = path.join(TRACKER_DIR, 'schema.sql');
export const SNAPSHOT_SCRIPT = path.join(TRACKER_DIR, 'scripts/snapshot.tsx');

export class PnpmSnapshotRenderer implements SnapshotRenderer {
  render(): void {
    const result = spawnSync('pnpm', ['exec', 'tsx', SNAPSHOT_SCRIPT], {
      cwd: TRACKER_DIR,
      stdio: 'inherit',
    });
    if (result.error) {
      throw new TrackerError(
        'render gagal: pnpm/tsx tidak tersedia. Jalankan `pnpm install` di tracker/ (atau `corepack enable`).',
      );
    }
    if (result.status !== 0) {
      throw new TrackerError('render gagal: snapshot error (lihat output di atas)');
    }
  }
}
