use tauri::Manager;

mod commands;
mod database;
mod errors;
mod services;
mod providers;

use services::CryptoService;
use services::ProviderService;
use database::DatabaseService;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize crypto service
            let crypto_service = CryptoService::new();
            app.manage(tokio::sync::Mutex::new(crypto_service));

            // Initialize provider service
            let provider_service = ProviderService::new();
            app.manage(tokio::sync::Mutex::new(provider_service));

            // Initialize database service
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data dir");

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            let db_path = app_data_dir.join("ai-orchestrator.db");
            let db_path_str = db_path.to_string_lossy().to_string();

            tauri::async_runtime::spawn(async move {
                let _db_service = DatabaseService::new(&db_path_str).await
                    .expect("Failed to initialize database");
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::unlock_app,
            commands::get_app_version,
            commands::add_provider,
            commands::remove_provider,
            commands::list_providers,
            commands::list_provider_models,
            commands::validate_provider_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
