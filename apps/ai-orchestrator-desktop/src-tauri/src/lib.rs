use tauri::Manager;

mod commands;
mod database;
mod errors;
mod models;
mod services;
mod providers;

use services::CryptoService;
use services::ProviderService;
use services::ComparisonService;
use database::DatabaseService;
use database::repositories::{ConversationRepository, MessageRepository, ComparisonSessionRepository, ComparisonResultRepository};

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

            // Initialize database
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data dir");

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            let db_path = app_data_dir.join("ai-orchestrator.db");
            let db_path_str = db_path.to_string_lossy().to_string();

            // Block on database initialization for now
            let db_service = std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(async {
                    DatabaseService::new(&db_path_str).await.expect("Failed to initialize database")
                })
            }).join().unwrap();

            // Initialize repositories
            let pool = db_service.pool();
            let conversation_repo = ConversationRepository::new(pool.clone());
            let message_repo = MessageRepository::new(pool.clone());
            let comparison_session_repo = ComparisonSessionRepository::new(pool.clone());
            let comparison_result_repo = ComparisonResultRepository::new(pool.clone());
            let comparison_service = ComparisonService::new();

            app.manage(conversation_repo);
            app.manage(message_repo);
            app.manage(comparison_session_repo);
            app.manage(comparison_result_repo);
            app.manage(comparison_service);
            app.manage(pool.clone());

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
            commands::create_conversation,
            commands::get_conversation,
            commands::list_conversations,
            commands::delete_conversation,
            commands::send_message,
            commands::get_conversation_messages,
            commands::run_comparison,
            commands::list_comparison_sessions,
            commands::get_comparison_results,
            commands::delete_comparison_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
