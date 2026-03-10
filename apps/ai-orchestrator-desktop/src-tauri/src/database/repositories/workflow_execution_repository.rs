use crate::models::workflow_execution::{WorkflowExecution, ExecutionStatus, WorkflowResult};
use crate::models::workflow::Workflow;
use crate::database::DatabaseError;
use crate::database::repositories::WorkflowRepository;
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub struct WorkflowExecutionRepository {
    pool: SqlitePool,
    workflow_repo: WorkflowRepository,
}

impl WorkflowExecutionRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool: pool.clone(),
            workflow_repo: WorkflowRepository::new(pool),
        }
    }

    pub async fn create(&self, workflow_id: String, input_prompt: String)
        -> Result<WorkflowExecution, DatabaseError>
    {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();
        let status_str = format!("{:?}", ExecutionStatus::Running);

        sqlx::query(
            "INSERT INTO workflow_executions (id, workflow_id, input_prompt, status, started_at)
             VALUES (?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&workflow_id)
        .bind(&input_prompt)
        .bind(&status_str)
        .bind(&now)
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<WorkflowExecution, DatabaseError> {
        let row = sqlx::query(
            "SELECT id, workflow_id, input_prompt, status, result_json, error_message, started_at, completed_at
             FROM workflow_executions WHERE id = ?"
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        let status_str: String = row.try_get("status")?;
        let status = match status_str.as_str() {
            "Pending" => ExecutionStatus::Pending,
            "Running" => ExecutionStatus::Running,
            "Completed" => ExecutionStatus::Completed,
            "Failed" => ExecutionStatus::Failed,
            _ => ExecutionStatus::Pending,
        };

        let result = Self::parse_result(row.try_get("result_json").ok())?;

        Ok(WorkflowExecution {
            id: row.try_get("id")?,
            workflow_id: row.try_get("workflow_id")?,
            input_prompt: row.try_get("input_prompt")?,
            status,
            result,
            error_message: row.try_get("error_message").ok(),
            started_at: row.try_get("started_at")?,
            completed_at: row.try_get("completed_at").ok(),
        })
    }

    pub async fn get_workflow(&self, id: &str) -> Result<Workflow, DatabaseError> {
        self.workflow_repo.get_by_id(id).await
    }

    pub async fn complete(&self, execution_id: &str, result: WorkflowResult)
        -> Result<WorkflowExecution, DatabaseError>
    {
        let now = chrono::Utc::now().to_rfc3339();
        let result_json = serde_json::to_string(&result)
            .map_err(|e| DatabaseError::QueryError(e.to_string()))?;
        let status_str = format!("{:?}", ExecutionStatus::Completed);

        sqlx::query(
            "UPDATE workflow_executions
             SET status = ?, result_json = ?, completed_at = ?
             WHERE id = ?"
        )
        .bind(&status_str)
        .bind(&result_json)
        .bind(&now)
        .bind(execution_id)
        .execute(&self.pool)
        .await?;

        self.get_by_id(execution_id).await
    }

    pub async fn fail(&self, execution_id: &str, error_message: String)
        -> Result<WorkflowExecution, DatabaseError>
    {
        let now = chrono::Utc::now().to_rfc3339();
        let status_str = format!("{:?}", ExecutionStatus::Failed);

        sqlx::query(
            "UPDATE workflow_executions
             SET status = ?, error_message = ?, completed_at = ?
             WHERE id = ?"
        )
        .bind(&status_str)
        .bind(&error_message)
        .bind(&now)
        .bind(execution_id)
        .execute(&self.pool)
        .await?;

        self.get_by_id(execution_id).await
    }

    pub async fn list_by_workflow(&self, workflow_id: &str)
        -> Result<Vec<WorkflowExecution>, DatabaseError>
    {
        let rows = sqlx::query(
            "SELECT id, workflow_id, input_prompt, status, result_json, error_message, started_at, completed_at
             FROM workflow_executions
             WHERE workflow_id = ?
             ORDER BY started_at DESC"
        )
        .bind(workflow_id)
        .fetch_all(&self.pool)
        .await?;

        let mut executions = Vec::new();
        for row in rows {
            let status_str: String = row.try_get("status")?;
            let status = match status_str.as_str() {
                "Pending" => ExecutionStatus::Pending,
                "Running" => ExecutionStatus::Running,
                "Completed" => ExecutionStatus::Completed,
                "Failed" => ExecutionStatus::Failed,
                _ => ExecutionStatus::Pending,
            };

            let result = Self::parse_result(row.try_get("result_json").ok())?;

            executions.push(WorkflowExecution {
                id: row.try_get("id").unwrap_or_default(),
                workflow_id: row.try_get("workflow_id").unwrap_or_default(),
                input_prompt: row.try_get("input_prompt").unwrap_or_default(),
                status,
                result,
                error_message: row.try_get("error_message").ok(),
                started_at: row.try_get("started_at").unwrap_or_default(),
                completed_at: row.try_get("completed_at").ok(),
            });
        }

        Ok(executions)
    }

    fn parse_result(result_json: Option<String>) -> Result<Option<WorkflowResult>, DatabaseError> {
        match result_json {
            Some(json) if !json.trim().is_empty() => {
                let parsed: WorkflowResult = serde_json::from_str(json.trim())
                    .map_err(|e| DatabaseError::QueryError(e.to_string()))?;
                Ok(Some(parsed))
            }
            _ => Ok(None),
        }
    }
}
