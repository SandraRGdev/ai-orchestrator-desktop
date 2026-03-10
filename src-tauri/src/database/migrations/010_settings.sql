-- Settings table for application settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Onboarding completion flag
INSERT OR IGNORE INTO settings (key, value) VALUES ('onboarding_completed', '0');

-- Theme preference
INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'system');
