pub const MIGRATIONS: &[(&str, &str)] = &[
    ("001_initial_schema", include_str!("migrations/001_initial_schema.sql")),
    ("002_conversations", include_str!("migrations/002_conversations.sql")),
    ("003_messages", include_str!("migrations/003_messages.sql")),
    ("004_comparison_sessions", include_str!("migrations/004_comparison_sessions.sql")),
    ("005_comparison_results", include_str!("migrations/005_comparison_results.sql")),
    ("007_agents", include_str!("migrations/007_agents.sql")),
    ("008_workflows", include_str!("migrations/008_workflows.sql")),
    ("009_workflow_executions", include_str!("migrations/009_workflow_executions.sql")),
    ("010_settings", include_str!("migrations/010_settings.sql")),
];

pub async fn run_migrations(pool: &sqlx::SqlitePool) -> Result<(), DatabaseError> {
    // Create migrations table if not exists
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )"
    )
    .execute(pool)
    .await?;

    for (idx, (version, sql)) in MIGRATIONS.iter().enumerate() {
        let name = version.split('_').last().unwrap_or(version);

        // Check if migration already applied
        let applied: Option<String> = sqlx::query_scalar(
            "SELECT version FROM schema_migrations WHERE version = ?"
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        if applied.is_none() {
            sqlx::query(sql)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::MigrationFailed {
                    migration: name.to_string(),
                    error: e.to_string(),
                })?;

            // Record migration
            sqlx::query(
                "INSERT INTO schema_migrations (version, name) VALUES (?, ?)"
            )
            .bind(name)
            .bind(name)
            .execute(pool)
            .await?;
        }
    }
    Ok(())
}

#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("Migration {migration} failed: {error}")]
    MigrationFailed { migration: String, error: String },

    #[error("Database connection error: {0}")]
    ConnectionError(#[from] sqlx::Error),

    #[error("Database query error: {0}")]
    QueryError(String),
}
