use tauri::State;
use crate::models::comparison_session::{ComparisonRequest, ComparisonSession, CreateComparisonSession};
use crate::models::comparison_result::{ComparisonResult, CreateComparisonResult};
use crate::services::comparison_service::ComparisonService;
use crate::database::repositories::{ComparisonSessionRepository, ComparisonResultRepository};

#[tauri::command]
pub async fn run_comparison(
    req: ComparisonRequest,
    provider_service: State<'_, crate::services::provider_service::ProviderService>,
    comparison_service: State<'_, ComparisonService>,
    session_repo: State<'_, ComparisonSessionRepository>,
    result_repo: State<'_, ComparisonResultRepository>,
) -> Result<Vec<ComparisonResult>, String> {
    // Create session
    let session = session_repo.create(CreateComparisonSession {
        prompt: req.prompt.clone(),
    }).await.map_err(|e| e.to_string())?;

    // Build comparison service with registered providers
    let providers = provider_service.list_providers();
    let mut comp_service = ComparisonService::new();

    for provider_config in providers {
        if let Some(provider) = provider_service.get_provider(&provider_config.id) {
            comp_service.register_provider(provider);
        }
    }

    // Execute comparison
    let results = comparison_service
        .execute_comparison(req, session.id.clone())
        .await
        .map_err(|e| e.to_string())?;

    // Save results
    for result in &results {
        result_repo.create(CreateComparisonResult {
            session_id: result.session_id.clone(),
            provider_id: result.provider_id.clone(),
            provider_name: result.provider_name.clone(),
            model_id: result.model_id.clone(),
            model_name: result.model_name.clone(),
            response: result.response.clone(),
            prompt_tokens: result.prompt_tokens,
            completion_tokens: result.completion_tokens,
            total_tokens: result.total_tokens,
            latency_ms: result.latency_ms,
            cost_usd: result.cost_usd,
        }).await.map_err(|e| e.to_string())?;
    }

    Ok(results)
}

#[tauri::command]
pub async fn list_comparison_sessions(
    repo: State<'_, ComparisonSessionRepository>,
) -> Result<Vec<ComparisonSession>, String> {
    repo.list_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_comparison_results(
    session_id: String,
    repo: State<'_, ComparisonResultRepository>,
) -> Result<Vec<ComparisonResult>, String> {
    repo.list_by_session(&session_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_comparison_session(
    id: String,
    repo: State<'_, ComparisonSessionRepository>,
) -> Result<(), String> {
    repo.delete(&id).await.map_err(|e| e.to_string())
}
