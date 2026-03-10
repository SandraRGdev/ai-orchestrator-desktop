use tauri::State;
use crate::models::comparison_session::{ComparisonRequest, ComparisonSession, CreateComparisonSession};
use crate::models::comparison_result::{ComparisonResult, CreateComparisonResult};
use crate::database::repositories::{ComparisonSessionRepository, ComparisonResultRepository};
use crate::providers::trait_definition::{PromptRequest, Message as ProviderMessage, MessageRole, ModelProvider};
use std::sync::Arc;
use uuid::Uuid;

#[tauri::command]
pub async fn run_comparison(
    req: ComparisonRequest,
    provider_service: State<'_, tokio::sync::Mutex<crate::services::provider_service::ProviderService>>,
    session_repo: State<'_, ComparisonSessionRepository>,
    result_repo: State<'_, ComparisonResultRepository>,
) -> Result<Vec<ComparisonResult>, String> {
    // Create session
    let session = session_repo.create(CreateComparisonSession {
        prompt: req.prompt.clone(),
    }).await.map_err(|e| e.to_string())?;

    // Get provider service and execute comparisons
    let provider_svc = provider_service.lock().await;
    let providers = provider_svc.list_providers();
    println!("🔍 Available providers: {:?}", providers.iter().map(|p| &p.id).collect::<Vec<_>>());
    println!("🔍 Requested model_configs: {:?}", req.model_configs);

    let mut tasks = Vec::new();

    for config in &req.model_configs {
        println!("🔍 Looking for provider: {}", config.provider_id);
        // Find matching provider
        if let Some(provider) = provider_svc.get_provider(&config.provider_id) {
            println!("✅ Found provider for {}, model: {}", config.provider_id, config.model_id);
            let provider = provider.clone();
            let prompt = req.prompt.clone();
            let model_id = config.model_id.clone();
            let provider_id = config.provider_id.clone();
            let session_id = session.id.clone();

            tasks.push(tokio::spawn(async move {
                execute_single_comparison(provider, provider_id, model_id, prompt, session_id).await
            }));
        } else {
            println!("❌ Provider {} not found", config.provider_id);
        }
    }
    drop(provider_svc);

    if tasks.is_empty() {
        return Err("No valid providers found. Please configure providers first.".to_string());
    }

    // Wait for all comparisons to complete
    let results = futures::future::join_all(tasks)
        .await
        .into_iter()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Task execution error: {}", e))?;

    let results = results.into_iter().collect::<Result<Vec<_>, _>>()
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

async fn execute_single_comparison(
    provider: Arc<dyn ModelProvider + Send + Sync>,
    provider_id: String,
    model_id: String,
    prompt: String,
    session_id: String,
) -> Result<ComparisonResult, String> {
    let start = std::time::Instant::now();

    let request = PromptRequest {
        model: model_id.clone(),
        messages: vec![ProviderMessage {
            role: MessageRole::User,
            content: prompt.clone(),
        }],
        temperature: Some(0.7),
        max_tokens: None,
        stream: Some(false),
    };

    let response = provider.send_prompt(request).await
        .map_err(|e| e.to_string())?;

    let latency_ms = start.elapsed().as_millis() as u64;

    // Calculate cost (placeholder)
    let cost_usd = calculate_cost(&provider_id, &model_id, response.usage.prompt_tokens, response.usage.completion_tokens);

    Ok(ComparisonResult {
        id: Uuid::new_v4().to_string(),
        session_id,
        provider_id: provider_id.clone(),
        provider_name: provider.provider_name().to_string(),
        model_id: model_id.clone(),
        model_name: model_id.clone(),
        response: response.content,
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
        latency_ms,
        cost_usd,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

fn calculate_cost(_provider_id: &str, _model_id: &str, prompt_tokens: u32, completion_tokens: u32) -> f64 {
    let prompt_cost = (prompt_tokens as f64) / 1000.0 * 0.0001;
    let completion_cost = (completion_tokens as f64) / 1000.0 * 0.0002;
    prompt_cost + completion_cost
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
