CREATE TABLE IF NOT EXISTS workflow_executions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    input_prompt TEXT NOT NULL,
    status TEXT NOT NULL,
    result_json TEXT,
    error_message TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow
    ON workflow_executions(workflow_id, started_at DESC);
