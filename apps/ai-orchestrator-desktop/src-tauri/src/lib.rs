use tauri::Manager;

mod commands;
mod database;
mod errors;
mod models;
mod services;
mod providers;
mod agents;

use services::CryptoService;
use services::ProviderService;
use services::ComparisonService;
use agents::executor::AgentExecutor;
use database::DatabaseService;
use database::repositories::{
    ConversationRepository, MessageRepository, ComparisonSessionRepository,
    ComparisonResultRepository, AgentRepository, WorkflowRepository,
    WorkflowExecutionRepository,
};

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

            // Initialize database (lazy, don't block)
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data dir");

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            // Spawn database initialization in background
            tauri::async_runtime::spawn(async move {
                let db_path = app_data_dir.join("ai-orchestrator.db");
                let db_path_str = db_path.to_string_lossy().to_string();

                match DatabaseService::new(&db_path_str).await {
                    Ok(db_service) => {
                        // TODO: Store db_service somewhere accessible
                        println!("Database initialized successfully");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {:?}", e);
                    }
                }
            });

            // Initialize comparison service (stateless for demo)
            let comparison_service = ComparisonService::new();

            // Initialize agent executor with preset agents
            let mut agent_executor = AgentExecutor::new();

            // Register preset agents
            for agent in crate::agents::preset_agents::get_preset_agents() {
                agent_executor.register_agent(agent);
            }

            // Manage services (for demo mode, repos are optional)
            app.manage(comparison_service);
            app.manage(agent_executor);

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
            commands::list_preset_agents,
            commands::list_all_agents,
            commands::create_custom_agent,
            commands::delete_agent,
            commands::create_workflow,
            commands::list_workflows,
            commands::get_workflow,
            commands::delete_workflow,
            commands::execute_workflow,
            commands::get_workflow_execution,
            commands::list_workflow_executions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
