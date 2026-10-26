// File-watch pada kanban.db (+ WAL) → notifikasi untuk SSE.
// node:sqlite tidak punya update_hook, dan writer-nya proses terpisah (tracker/cli.mjs),
// jadi perubahan dideteksi lewat filesystem.
import fs from 'node:fs';
import { DB_PATH } from './db';

type Listener = () => void;

interface WatchState {
  listeners: Set<Listener>;
  watchers: fs.FSWatcher[];
  timer: NodeJS.Timeout | null;
}

// Simpan di globalThis agar tidak berlipat saat hot-reload / beberapa request.
const g = globalThis as unknown as { __trackerWatch?: WatchState };

function state(): WatchState {
  g.__trackerWatch ??= { listeners: new Set(), watchers: [], timer: null };
  return g.__trackerWatch;
}

function ensureWatchers() {
  const s = state();
  if (s.watchers.length) return;
  const files = [DB_PATH, `${DB_PATH}-wal`];
  for (const file of files) {
    if (!fs.existsSync(/*turbopackIgnore: true*/ file)) continue;
    try {
      const watcher = fs.watch(file, { persistent: false }, () => {
        if (s.timer) clearTimeout(s.timer);
        s.timer = setTimeout(() => {
          for (const listener of s.listeners) listener();
        }, 150);
      });
      watcher.on('error', () => {
        /* file diganti (checkpoint) — watcher berikutnya dibuat ulang oleh request baru */
      });
      s.watchers.push(watcher);
    } catch {
      /* abaikan: file bisa hilang saat checkpoint WAL */
    }
  }
}

export function subscribe(listener: Listener): () => void {
  const s = state();
  ensureWatchers();
  s.listeners.add(listener);
  return () => {
    s.listeners.delete(listener);
    if (s.listeners.size === 0) {
      for (const w of s.watchers) w.close();
      s.watchers = [];
      if (s.timer) clearTimeout(s.timer);
      s.timer = null;
    }
  };
}
