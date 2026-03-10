use crate::models::workflow::{Workflow, CreateWorkflowRequest, FlowType, WorkflowNode};
use crate::database::DatabaseError;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct WorkflowRepository {
    pool: SqlitePool,
}

impl WorkflowRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateWorkflowRequest) -> Result<Workflow, DatabaseError> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let flow_type_str = format!("{:?}", req.flow_type);
        let config_json = serde_json::to_string(&req.nodes)
            .map_err(|e| DatabaseError::QueryError(e.to_string()))?;

        sqlx::query(
            "INSERT INTO workflows (id, name, description, flow_type, config_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&flow_type_str)
        .bind(&config_json)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Workflow, DatabaseError> {
        let row = sqlx::query(
            "SELECT id, name, description, flow_type, config_json, created_at, updated_at
             FROM workflows WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        let flow_type_str: String = row.try_get("flow_type")?;
        let flow_type = match flow_type_str.as_str() {
            "Sequential" => FlowType::Sequential,
            "Parallel" => FlowType::Parallel,
            "Evaluator" => FlowType::Evaluator,
            _ => FlowType::Sequential,
        };

        let config_json: String = row.try_get("config_json")?;
        let nodes = Self::parse_nodes(&config_json)?;

        Ok(Workflow {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            description: row.try_get("description")?,
            flow_type,
            nodes,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }

    pub async fn list_all(&self) -> Result<Vec<Workflow>, DatabaseError> {
        let rows = sqlx::query(
            "SELECT id, name, description, flow_type, config_json, created_at, updated_at
             FROM workflows ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        let mut workflows = Vec::new();
        for row in rows {
            let flow_type_str: String = row.try_get("flow_type")?;
            let flow_type = match flow_type_str.as_str() {
                "Sequential" => FlowType::Sequential,
                "Parallel" => FlowType::Parallel,
                "Evaluator" => FlowType::Evaluator,
                _ => FlowType::Sequential,
            };

            let config_json: String = row.try_get("config_json")?;
            let nodes = match Self::parse_nodes(&config_json) {
                Ok(parsed) => parsed,
                Err(e) => {
                    eprintln!("Skipping malformed workflow row: {}", e);
                    continue;
                }
            };

            workflows.push(Workflow {
                id: row.try_get("id").unwrap_or_default(),
                name: row.try_get("name").unwrap_or_default(),
                description: row.try_get("description").ok(),
                flow_type,
                nodes,
                created_at: row.try_get("created_at").unwrap_or_default(),
                updated_at: row.try_get("updated_at").unwrap_or_default(),
            });
        }

        Ok(workflows)
    }

    pub async fn update(&self, id: &str, req: CreateWorkflowRequest) -> Result<Workflow, DatabaseError> {
        let now = chrono::Utc::now().to_rfc3339();
        let flow_type_str = format!("{:?}", req.flow_type);
        let config_json = serde_json::to_string(&req.nodes)
            .map_err(|e| DatabaseError::QueryError(e.to_string()))?;

        sqlx::query(
            "UPDATE workflows
             SET name = ?, description = ?, flow_type = ?, config_json = ?, updated_at = ?
             WHERE id = ?"
        )
        .bind(&req.name)
        .bind(&req.description)
        .bind(&flow_type_str)
        .bind(&config_json)
        .bind(&now)
        .bind(id)
        .execute(&self.pool)
        .await?;

        self.get_by_id(id).await
    }

    pub async fn delete(&self, id: &str) -> Result<(), DatabaseError> {
        let mut tx = self.pool.begin().await?;

        // Keep deletion compatible with old SQLite files:
        // - some may not define ON DELETE CASCADE
        // - some may not have workflow_executions yet
        let has_executions_table: Option<String> = sqlx::query_scalar(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workflow_executions' LIMIT 1"
        )
        .fetch_optional(&mut *tx)
        .await?;

        if has_executions_table.is_some() {
            sqlx::query("DELETE FROM workflow_executions WHERE workflow_id = ?")
                .bind(id)
                .execute(&mut *tx)
                .await?;
        }

        sqlx::query("DELETE FROM workflows WHERE id = ?")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;

        Ok(())
    }

    fn parse_nodes(config_json: &str) -> Result<Vec<WorkflowNode>, DatabaseError> {
        let trimmed = config_json.trim();
        if trimmed.is_empty() {
            return Ok(vec![]);
        }

        serde_json::from_str(trimmed)
            .map_err(|e| DatabaseError::QueryError(e.to_string()))
    }
}
