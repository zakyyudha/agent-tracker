-- Agent Tracker — SQLite Schema (source of truth: kanban.db)
-- Board live: Next.js read-only via API + SSE. CLI is single writer.
CREATE TABLE IF NOT EXISTS brd (
  id          TEXT PRIMARY KEY,            -- e.g. BR-001
  title       TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task (
  id        TEXT PRIMARY KEY,              -- e.g. TASK-001 (Backlog item)
  brd_id    TEXT NOT NULL REFERENCES brd(id),
  usecase   TEXT NOT NULL,
  module    TEXT NOT NULL,
  task_name TEXT NOT NULL,
  figma     TEXT,
  sp        INTEGER,
  ac        TEXT,                          -- Acceptance Criteria
  dod       TEXT,                          -- Definition of Done
  notes     TEXT,                          -- Technical notes
  UNIQUE(brd_id)
);

CREATE TABLE IF NOT EXISTS ticket (
  id         TEXT PRIMARY KEY,             -- e.g. TASK-001-T1 (Atomic ticket)
  task_id    TEXT NOT NULL REFERENCES task(id),
  seq        INTEGER NOT NULL,             -- Sequential order within backlog (T1 < T2 < ...)
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'todo'
             CHECK (status IN ('todo','in_progress','in_review','done')),
  assignee   TEXT NOT NULL DEFAULT 'TBD',
  sprint     TEXT NOT NULL DEFAULT 'Backlog',
  evidence   TEXT,                         -- Terminal execution evidence for in_review & done
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
