use crate::models::conversation::{Conversation, CreateConversation};
use crate::database::DatabaseError;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct ConversationRepository {
    pool: SqlitePool,
}

impl ConversationRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateConversation) -> Result<Conversation, DatabaseError> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO conversations (id, title, model_id, provider_id) VALUES (?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.title)
        .bind(&req.model_id)
        .bind(&req.provider_id)
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Conversation, DatabaseError> {
        let row = sqlx::query(
            "SELECT id, title, model_id, provider_id, created_at, updated_at FROM conversations WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        Ok(Conversation {
            id: row.try_get("id")?,
            title: row.try_get("title")?,
            model_id: row.try_get("model_id")?,
            provider_id: row.try_get("provider_id")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }

    pub async fn list_all(&self) -> Result<Vec<Conversation>, DatabaseError> {
        let rows = sqlx::query(
            "SELECT id, title, model_id, provider_id, created_at, updated_at FROM conversations ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        let conversations = rows.iter().map(|row| {
            Conversation {
                id: row.try_get("id").unwrap_or_default(),
                title: row.try_get("title").unwrap_or_default(),
                model_id: row.try_get("model_id").unwrap_or_default(),
                provider_id: row.try_get("provider_id").unwrap_or_default(),
                created_at: row.try_get("created_at").unwrap_or_default(),
                updated_at: row.try_get("updated_at").unwrap_or_default(),
            }
        }).collect();

        Ok(conversations)
    }

    pub async fn delete(&self, id: &str) -> Result<(), DatabaseError> {
        sqlx::query("DELETE FROM conversations WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
