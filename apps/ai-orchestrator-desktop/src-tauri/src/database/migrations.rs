pub const MIGRATIONS: &[(&str, &str)] = &[
    ("001_initial_schema", include_str!("migrations/001_initial_schema.sql")),
];

pub async fn run_migrations(pool: &sqlx::SqlitePool) -> Result<(), DatabaseError> {
    // Create migrations table if not exists
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )"
    )
    .execute(pool)
    .await?;

    for (version, sql) in MIGRATIONS {
        let name = version.split('_').last().unwrap_or(version);

        // Check if migration already applied
        let applied: Option<i64> = sqlx::query_scalar(
            "SELECT version FROM schema_migrations WHERE name = ?"
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
            .bind(chrono::Utc::now().timestamp())
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
