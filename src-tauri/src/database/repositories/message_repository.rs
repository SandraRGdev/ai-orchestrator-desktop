use crate::models::message::{Message, CreateMessage, MessageRole};
use crate::database::DatabaseError;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct MessageRepository {
    pool: SqlitePool,
}

impl MessageRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateMessage) -> Result<Message, DatabaseError> {
        let id = Uuid::new_v4().to_string();
        let role_str = format!("{:?}", req.role);

        sqlx::query(
            "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.conversation_id)
        .bind(&role_str)
        .bind(&req.content)
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Message, DatabaseError> {
        let row = sqlx::query(
            "SELECT id, conversation_id, role, content, tokens, latency_ms, created_at FROM messages WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        let role_str: String = row.try_get("role")?;
        let role = parse_role(&role_str);

        Ok(Message {
            id: row.try_get("id")?,
            conversation_id: row.try_get("conversation_id")?,
            role,
            content: row.try_get("content")?,
            tokens: row.try_get("tokens").ok(),
            latency_ms: row.try_get("latency_ms").ok(),
            created_at: row.try_get("created_at")?,
        })
    }

    pub async fn list_by_conversation(&self, conversation_id: &str) -> Result<Vec<Message>, DatabaseError> {
        let rows = sqlx::query(
            "SELECT id, conversation_id, role, content, tokens, latency_ms, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
        )
        .bind(conversation_id)
        .fetch_all(&self.pool)
        .await?;

        let messages = rows.iter().map(|row| {
            let role_str: String = row.try_get("role").unwrap_or_default();
            let role = parse_role(&role_str);

            Message {
                id: row.try_get("id").unwrap_or_default(),
                conversation_id: row.try_get("conversation_id").unwrap_or_default(),
                role,
                content: row.try_get("content").unwrap_or_default(),
                tokens: row.try_get("tokens").ok(),
                latency_ms: row.try_get("latency_ms").ok(),
                created_at: row.try_get("created_at").unwrap_or_default(),
            }
        }).collect();

        Ok(messages)
    }

    pub async fn update_tokens(&self, id: &str, tokens: u32, latency_ms: u64) -> Result<(), DatabaseError> {
        sqlx::query("UPDATE messages SET tokens = ?, latency_ms = ? WHERE id = ?")
            .bind(tokens as i32)
            .bind(latency_ms as i64)
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}

fn parse_role(role_str: &str) -> MessageRole {
    match role_str {
        "System" => MessageRole::System,
        "User" => MessageRole::User,
        "Assistant" => MessageRole::Assistant,
        _ => MessageRole::User,
    }
}
