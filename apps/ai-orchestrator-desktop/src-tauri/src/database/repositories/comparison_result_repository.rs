use crate::models::comparison_result::{ComparisonResult, CreateComparisonResult};
use crate::database::DatabaseError;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct ComparisonResultRepository {
    pool: SqlitePool,
}

impl ComparisonResultRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateComparisonResult) -> Result<ComparisonResult, DatabaseError> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO comparison_results (id, session_id, provider_id, model_id, response, prompt_tokens, completion_tokens, total_tokens, latency_ms, cost_usd)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.session_id)
        .bind(&req.provider_id)
        .bind(&req.model_id)
        .bind(&req.response)
        .bind(req.prompt_tokens as i32)
        .bind(req.completion_tokens as i32)
        .bind(req.total_tokens as i32)
        .bind(req.latency_ms as i64)
        .bind(req.cost_usd)
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<ComparisonResult, DatabaseError> {
        let row = sqlx::query(
            "SELECT id, session_id, provider_id, model_id, response, prompt_tokens, completion_tokens, total_tokens, latency_ms, cost_usd, created_at
             FROM comparison_results WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(ComparisonResult {
            id: row.try_get("id")?,
            session_id: row.try_get("session_id")?,
            provider_id: row.try_get("provider_id")?,
            provider_name: row.try_get("provider_id")?, // Will be updated by service
            model_id: row.try_get("model_id")?,
            model_name: row.try_get("model_id")?, // Will be updated by service
            response: row.try_get("response")?,
            prompt_tokens: row.try_get::<i32, _>("prompt_tokens")? as u32,
            completion_tokens: row.try_get::<i32, _>("completion_tokens")? as u32,
            total_tokens: row.try_get::<i32, _>("total_tokens")? as u32,
            latency_ms: row.try_get::<i64, _>("latency_ms")? as u64,
            cost_usd: row.try_get("cost_usd")?,
            created_at: row.try_get("created_at")?,
        })
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<ComparisonResult>, DatabaseError> {
        let rows = sqlx::query(
            "SELECT id, session_id, provider_id, model_id, response, prompt_tokens, completion_tokens, total_tokens, latency_ms, cost_usd, created_at
             FROM comparison_results WHERE session_id = ? ORDER BY latency_ms ASC"
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        let results = rows.iter().map(|row| {
            ComparisonResult {
                id: row.try_get("id").unwrap_or_default(),
                session_id: row.try_get("session_id").unwrap_or_default(),
                provider_id: row.try_get("provider_id").unwrap_or_default(),
                provider_name: row.try_get("provider_id").unwrap_or_default(),
                model_id: row.try_get("model_id").unwrap_or_default(),
                model_name: row.try_get("model_id").unwrap_or_default(),
                response: row.try_get("response").unwrap_or_default(),
                prompt_tokens: row.try_get::<i32, _>("prompt_tokens").unwrap_or(0) as u32,
                completion_tokens: row.try_get::<i32, _>("completion_tokens").unwrap_or(0) as u32,
                total_tokens: row.try_get::<i32, _>("total_tokens").unwrap_or(0) as u32,
                latency_ms: row.try_get::<i64, _>("latency_ms").unwrap_or(0) as u64,
                cost_usd: row.try_get("cost_usd").unwrap_or(0.0),
                created_at: row.try_get("created_at").unwrap_or_default(),
            }
        }).collect();

        Ok(results)
    }
}
