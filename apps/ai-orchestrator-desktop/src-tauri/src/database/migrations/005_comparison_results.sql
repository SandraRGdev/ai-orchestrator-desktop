CREATE TABLE IF NOT EXISTS comparison_results (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES comparison_sessions(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    response TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    latency_ms INTEGER,
    cost_usd REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comparison_results_session ON comparison_results(session_id);
