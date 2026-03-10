use tauri::State;
use crate::services::settings_service::{SettingsService, SettingsError};

/// Check if onboarding has been completed
#[tauri::command]
pub async fn is_onboarding_completed(
    settings: State<'_, SettingsService>,
) -> Result<bool, String> {
    settings.is_onboarding_completed()
        .await
        .map_err(|e: SettingsError| e.to_string())
}

/// Mark onboarding as completed
#[tauri::command]
pub async fn complete_onboarding(
    settings: State<'_, SettingsService>,
) -> Result<(), String> {
    settings.complete_onboarding()
        .await
        .map_err(|e: SettingsError| e.to_string())
}

/// Get a setting value by key
#[tauri::command]
pub async fn get_setting(
    key: String,
    settings: State<'_, SettingsService>,
) -> Result<Option<String>, String> {
    settings.get(&key)
        .await
        .map_err(|e: SettingsError| e.to_string())
}

/// Set a setting value by key
#[tauri::command]
pub async fn set_setting(
    key: String,
    value: String,
    settings: State<'_, SettingsService>,
) -> Result<(), String> {
    settings.set(&key, &value)
        .await
        .map_err(|e: SettingsError| e.to_string())
}

/// Get theme preference
#[tauri::command]
pub async fn get_theme(
    settings: State<'_, SettingsService>,
) -> Result<String, String> {
    settings.get_theme()
        .await
        .map_err(|e: SettingsError| e.to_string())
}

/// Set theme preference
#[tauri::command]
pub async fn set_theme(
    theme: String,
    settings: State<'_, SettingsService>,
) -> Result<(), String> {
    settings.set_theme(&theme)
        .await
        .map_err(|e: SettingsError| e.to_string())
}
