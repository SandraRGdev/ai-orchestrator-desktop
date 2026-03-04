use crate::models::agent_definition::{AgentDefinition, CreateAgentRequest, AgentType, AgentConfig};
use crate::database::DatabaseError;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct AgentRepository {
    pool: SqlitePool,
}

impl AgentRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateAgentRequest) -> Result<AgentDefinition, DatabaseError> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let agent_type_str = format!("{:?}", req.agent_type);
        let config_json = serde_json::to_string(&req.config)
            .map_err(|e| DatabaseError::QueryError(e.to_string()))?;

        sqlx::query(
            "INSERT INTO agents (id, name, description, type, is_preset, config_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&agent_type_str)
        .bind(&config_json)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<AgentDefinition, DatabaseError> {
        let row = sqlx::query(
            "SELECT id, name, description, type, is_preset, config_json, created_at, updated_at
             FROM agents WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        let agent_type_str: String = row.try_get("type")?;
        let agent_type = match agent_type_str.as_str() {
            "Researcher" => AgentType::Researcher,
            "Writer" => AgentType::Writer,
            "Analyst" => AgentType::Analyst,
            "Evaluator" => AgentType::Evaluator,
            "Custom" => AgentType::Custom,
            _ => AgentType::Custom,
        };

        let config_json: String = row.try_get("config_json")?;
        let config: AgentConfig = serde_json::from_str(&config_json)
            .map_err(|e| DatabaseError::QueryError(e.to_string()))?;

        Ok(AgentDefinition {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            description: row.try_get("description")?,
            agent_type,
            is_preset: row.try_get("is_preset")?,
            config,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }

    pub async fn list_all(&self) -> Result<Vec<AgentDefinition>, DatabaseError> {
        let rows = sqlx::query(
            "SELECT id, name, description, type, is_preset, config_json, created_at, updated_at
             FROM agents ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        let mut agents = Vec::new();
        for row in rows {
            let agent_type_str: String = row.try_get("type")?;
            let agent_type = match agent_type_str.as_str() {
                "Researcher" => AgentType::Researcher,
                "Writer" => AgentType::Writer,
                "Analyst" => AgentType::Analyst,
                "Evaluator" => AgentType::Evaluator,
                "Custom" => AgentType::Custom,
                _ => AgentType::Custom,
            };

            let config_json: String = row.try_get("config_json")?;
            let config: AgentConfig = serde_json::from_str(&config_json)
                .map_err(|e| DatabaseError::QueryError(e.to_string()))?;

            agents.push(AgentDefinition {
                id: row.try_get("id").unwrap_or_default(),
                name: row.try_get("name").unwrap_or_default(),
                description: row.try_get("description").ok(),
                agent_type,
                is_preset: row.try_get::<i64, _>("is_preset").unwrap_or(0) != 0,
                config,
                created_at: row.try_get("created_at").unwrap_or_default(),
                updated_at: row.try_get("updated_at").unwrap_or_default(),
            });
        }

        Ok(agents)
    }

    pub async fn delete(&self, id: &str) -> Result<(), DatabaseError> {
        sqlx::query("DELETE FROM agents WHERE id = ? AND is_preset = 0")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
