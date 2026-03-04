CREATE TABLE IF NOT EXISTS comparison_sessions (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comparison_sessions_created ON comparison_sessions(created_at DESC);
