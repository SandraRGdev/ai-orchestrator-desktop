use tauri::State;
use crate::services::provider_service::{ProviderService, ProviderConfig};
use crate::providers::trait_definition::{ModelInfo, ModelProvider, ProviderError};

#[tauri::command]
pub async fn add_provider(
    id: String,
    name: String,
    provider_type: String,
    api_key: String,
    base_url: Option<String>,
    provider_service: State<'_, tokio::sync::Mutex<ProviderService>>,
) -> Result<(), String> {
    let mut service = provider_service.lock().await;

    match provider_type.as_str() {
        "openai" => {
            service.register_openai(id, name, api_key, base_url).await
                .map_err(|e| e.to_string())?;
        }
        "anthropic" => {
            service.register_anthropic(id, name, api_key).await
                .map_err(|e| e.to_string())?;
        }
        _ => return Err("Unknown provider type".to_string()),
    }

    Ok(())
}

#[tauri::command]
pub async fn remove_provider(
    id: String,
    provider_service: State<'_, tokio::sync::Mutex<ProviderService>>,
) -> Result<(), String> {
    let mut service = provider_service.lock().await;
    service.remove_provider(&id)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn list_providers(
    provider_service: State<'_, tokio::sync::Mutex<ProviderService>>,
) -> Result<Vec<ProviderConfig>, String> {
    let service = provider_service.lock().await;
    Ok(service.list_providers())
}

#[tauri::command]
pub async fn list_provider_models(
    provider_id: String,
    provider_service: State<'_, tokio::sync::Mutex<ProviderService>>,
) -> Result<Vec<ModelInfo>, String> {
    let service = provider_service.lock().await;
    let provider = service.get_provider(&provider_id)
        .ok_or_else(|| "Provider not found".to_string())?;

    provider.list_models().await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn validate_provider_api_key(
    provider_type: String,
    api_key: String,
) -> Result<bool, String> {
    match provider_type.as_str() {
        "openai" => {
            let provider = crate::providers::openai_provider::OpenAIProvider::new(api_key.clone(), None);
            provider.validate_api_key(&api_key).await
                .map_err(|e: ProviderError| e.to_string())
        }
        "anthropic" => {
            let provider = crate::providers::anthropic_provider::AnthropicProvider::new(api_key.clone());
            provider.validate_api_key(&api_key).await
                .map_err(|e: ProviderError| e.to_string())
        }
        _ => Err("Unknown provider type".to_string()),
    }
}
