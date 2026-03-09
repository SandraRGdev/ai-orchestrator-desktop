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
        "google" => {
            service.register_google(id, name, api_key).await
                .map_err(|e| e.to_string())?;
        }
        "groq" => {
            service.register_groq(id, name, api_key).await
                .map_err(|e| e.to_string())?;
        }
        "openrouter" => {
            service.register_openrouter(id, name, api_key, base_url).await
                .map_err(|e| e.to_string())?;
        }
        _ => return Err("Unknown provider type".to_string()),
    }

    Ok(())
}

#[tauri::command]
pub async fn update_provider(
    id: String,
    name: String,
    provider_type: String,
    api_key: String,
    base_url: Option<String>,
    provider_service: State<'_, tokio::sync::Mutex<ProviderService>>,
) -> Result<(), String> {
    println!("🔧 Rust: update_provider called with id: {}, name: {}, type: {}", id, name, provider_type);
    // First remove the old provider
    let mut service = provider_service.lock().await;
    println!("🔧 Rust: Acquired service lock, attempting to remove old provider");
    match service.remove_provider(&id) {
        Ok(_) => println!("🔧 Rust: Old provider removed successfully"),
        Err(e) => {
            eprintln!("❌ Rust: Failed to remove old provider: {}", e);
            return Err(e.to_string());
        }
    }
    drop(service);

    println!("🔧 Rust: Calling add_provider to re-register with new details");
    // Then add the updated provider
    match add_provider(id, name, provider_type, api_key, base_url, provider_service).await {
        Ok(_) => {
            println!("🔧 Rust: Provider updated successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("❌ Rust: Failed to add updated provider: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn remove_provider(
    id: String,
    provider_service: State<'_, tokio::sync::Mutex<ProviderService>>,
) -> Result<(), String> {
    println!("🔧 Rust: remove_provider called with id: {}", id);
    let mut service = provider_service.lock().await;
    println!("🔧 Rust: Acquired service lock, attempting to remove provider");
    match service.remove_provider(&id) {
        Ok(_) => {
            println!("🔧 Rust: Provider removed successfully");
            Ok(())
        }
        Err(e) => {
            eprintln!("❌ Rust: Failed to remove provider: {}", e);
            Err(e.to_string())
        }
    }
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
        "google" => {
            let provider = crate::providers::google_provider::GoogleProvider::new(api_key.clone());
            provider.validate_api_key(&api_key).await
                .map_err(|e: ProviderError| e.to_string())
        }
        "groq" => {
            let provider = crate::providers::groq_provider::GroqProvider::new(api_key.clone());
            provider.validate_api_key(&api_key).await
                .map_err(|e: ProviderError| e.to_string())
        }
        "openrouter" => {
            let provider = crate::providers::openrouter_provider::OpenRouterProvider::new(api_key.clone(), None);
            provider.validate_api_key(&api_key).await
                .map_err(|e: ProviderError| e.to_string())
        }
        _ => Err("Unknown provider type".to_string()),
    }
}
