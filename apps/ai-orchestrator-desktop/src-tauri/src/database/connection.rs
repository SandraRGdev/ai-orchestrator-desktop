use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use std::str::FromStr;
use crate::database::DatabaseError;

pub struct DatabaseService {
    pool: SqlitePool,
}

impl DatabaseService {
    pub async fn new(db_path: &str) -> Result<Self, DatabaseError> {
        let options = SqliteConnectOptions::from_str(db_path)?
            .create_if_missing(true);

        let pool = SqlitePool::connect_with(options).await?;

        // Configure pragmas for performance and safety
        sqlx::query("PRAGMA journal_mode=WAL")
            .execute(&pool)
            .await?;

        sqlx::query("PRAGMA synchronous=NORMAL")
            .execute(&pool)
            .await?;

        sqlx::query("PRAGMA cache_size=-64000")
            .execute(&pool)
            .await?;

        sqlx::query("PRAGMA foreign_keys=ON")
            .execute(&pool)
            .await?;

        // Run migrations
        crate::database::run_migrations(&pool).await?;

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
