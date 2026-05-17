-- Migration: 0003_sync_log.sql
-- Track scrape/sync operations for monitoring

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',  -- 'success' | 'failed' | 'running'
  facilities_updated INTEGER DEFAULT 0,
  error_message TEXT,
  source TEXT DEFAULT 'manual'  -- 'manual' | 'ci' | 'worker'
);

CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
