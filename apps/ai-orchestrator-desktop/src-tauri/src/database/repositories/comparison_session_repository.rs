use crate::models::comparison_session::{ComparisonSession, CreateComparisonSession};
use crate::database::DatabaseError;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct ComparisonSessionRepository {
    pool: SqlitePool,
}

impl ComparisonSessionRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateComparisonSession) -> Result<ComparisonSession, DatabaseError> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO comparison_sessions (id, prompt) VALUES (?, ?)"
        )
        .bind(&id)
        .bind(&req.prompt)
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<ComparisonSession, DatabaseError> {
        let row = sqlx::query(
            "SELECT id, prompt, created_at FROM comparison_sessions WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(ComparisonSession {
            id: row.try_get("id")?,
            prompt: row.try_get("prompt")?,
            created_at: row.try_get("created_at")?,
        })
    }

    pub async fn list_all(&self) -> Result<Vec<ComparisonSession>, DatabaseError> {
        let rows = sqlx::query(
            "SELECT id, prompt, created_at FROM comparison_sessions ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        let sessions = rows.iter().map(|row| {
            ComparisonSession {
                id: row.try_get("id").unwrap_or_default(),
                prompt: row.try_get("prompt").unwrap_or_default(),
                created_at: row.try_get("created_at").unwrap_or_default(),
            }
        }).collect();

        Ok(sessions)
    }

    pub async fn delete(&self, id: &str) -> Result<(), DatabaseError> {
        sqlx::query("DELETE FROM comparison_sessions WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
