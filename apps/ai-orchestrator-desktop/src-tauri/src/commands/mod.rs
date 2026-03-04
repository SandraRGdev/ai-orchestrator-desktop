use tauri::State;
use crate::services::CryptoService;

pub mod provider_commands;
pub mod conversation_commands;
pub mod chat_commands;
pub mod comparison_commands;

pub use provider_commands::*;
pub use conversation_commands::*;
pub use chat_commands::*;
pub use comparison_commands::*;

#[tauri::command]
pub async fn unlock_app(
    password: String,
    crypto: State<'_, tokio::sync::Mutex<CryptoService>>,
) -> Result<(), String> {
    let mut crypto = crypto.lock().await;
    crypto.unlock(&password)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}
