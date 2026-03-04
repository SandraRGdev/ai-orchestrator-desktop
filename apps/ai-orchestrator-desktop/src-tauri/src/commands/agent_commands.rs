use tauri::State;
use crate::models::{
    agent_definition::{CreateAgentRequest, AgentDefinition},
    workflow::{CreateWorkflowRequest, Workflow},
    workflow_execution::WorkflowExecution,
};
use crate::agents::executor::AgentExecutor;
use crate::agents::preset_agents;
use crate::database::repositories::{
    AgentRepository, WorkflowRepository, WorkflowExecutionRepository,
};

#[tauri::command]
pub async fn list_preset_agents() -> Result<Vec<AgentDefinition>, String> {
    Ok(preset_agents::get_preset_agents())
}

#[tauri::command]
pub async fn list_all_agents(
    repo: State<'_, AgentRepository>,
) -> Result<Vec<AgentDefinition>, String> {
    repo.list_all().await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_custom_agent(
    req: CreateAgentRequest,
    repo: State<'_, AgentRepository>,
) -> Result<AgentDefinition, String> {
    repo.create(req).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_agent(
    id: String,
    repo: State<'_, AgentRepository>,
) -> Result<(), String> {
    repo.delete(&id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_workflow(
    req: CreateWorkflowRequest,
    repo: State<'_, WorkflowRepository>,
) -> Result<Workflow, String> {
    repo.create(req).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_workflows(
    repo: State<'_, WorkflowRepository>,
) -> Result<Vec<Workflow>, String> {
    repo.list_all().await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_workflow(
    id: String,
    repo: State<'_, WorkflowRepository>,
) -> Result<Workflow, String> {
    repo.get_by_id(&id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_workflow(
    id: String,
    repo: State<'_, WorkflowRepository>,
) -> Result<(), String> {
    repo.delete(&id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn execute_workflow(
    workflow_id: String,
    input_prompt: String,
    executor: State<'_, AgentExecutor>,
    execution_repo: State<'_, WorkflowExecutionRepository>,
) -> Result<WorkflowExecution, String> {
    let workflow = execution_repo.get_workflow(&workflow_id).await
        .map_err(|e| e.to_string())?;

    let execution = execution_repo.create(workflow_id.clone(), input_prompt.clone()).await
        .map_err(|e| e.to_string())?;

    match executor.execute_workflow(&workflow, input_prompt).await {
        Ok(result) => {
            execution_repo.complete(&execution.id, result).await
                .map_err(|e| e.to_string())
        }
        Err(e) => {
            execution_repo.fail(&execution.id, e.to_string()).await
                .map_err(|err| format!("Failed to record error: {}", err))?;
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_workflow_execution(
    id: String,
    repo: State<'_, WorkflowExecutionRepository>,
) -> Result<WorkflowExecution, String> {
    repo.get_by_id(&id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_workflow_executions(
    workflow_id: String,
    repo: State<'_, WorkflowExecutionRepository>,
) -> Result<Vec<WorkflowExecution>, String> {
    repo.list_by_workflow(&workflow_id).await
        .map_err(|e| e.to_string())
}
