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
use services::SettingsService;
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

            // Initialize database path
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data dir");

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            let db_path = app_data_dir.join("ai-orchestrator.db");
            let db_path_str = db_path.to_string_lossy().to_string();

            // Create a channel for database initialization result
            let (tx, rx) = std::sync::mpsc::channel();

            // Spawn database initialization in background
            std::thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                let result = rt.block_on(async {
                    DatabaseService::new(&db_path_str).await
                });
                tx.send(result).unwrap();
            });

            // Wait for database to be initialized (with timeout)
            let db_service = match rx.recv_timeout(std::time::Duration::from_secs(5)) {
                Ok(Ok(db)) => {
                    println!("Database initialized successfully");
                    Some(db)
                }
                Ok(Err(e)) => {
                    eprintln!("Failed to initialize database: {:?}", e);
                    None
                }
                Err(_) => {
                    eprintln!("Database initialization timeout");
                    None
                }
            };

            // Initialize repositories only if database is available
            if let Some(db) = db_service {
                let pool = db.pool().clone();

                let conversation_repo = ConversationRepository::new(pool.clone());
                let message_repo = MessageRepository::new(pool.clone());
                let comparison_session_repo = ComparisonSessionRepository::new(pool.clone());
                let comparison_result_repo = ComparisonResultRepository::new(pool.clone());
                let agent_repo = AgentRepository::new(pool.clone());
                let workflow_repo = WorkflowRepository::new(pool.clone());
                let workflow_execution_repo = WorkflowExecutionRepository::new(pool.clone());
                let settings_service = SettingsService::new(pool);

                // Manage repositories in Tauri state
                app.manage(conversation_repo);
                app.manage(message_repo);
                app.manage(comparison_session_repo);
                app.manage(comparison_result_repo);
                app.manage(agent_repo);
                app.manage(workflow_repo);
                app.manage(workflow_execution_repo);
                app.manage(settings_service);

                println!("Repositories managed successfully");
            } else {
                eprintln!("Warning: Repositories not available - chat and workflows may not work");
            }

            // Initialize comparison service (stateless for demo)
            let comparison_service = ComparisonService::new();

            // Initialize agent executor with preset agents
            let mut agent_executor = AgentExecutor::new();

            // Register preset agents
            for agent in crate::agents::preset_agents::get_preset_agents() {
                agent_executor.register_agent(agent);
            }

            // Manage services
            app.manage(comparison_service);
            app.manage(agent_executor);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::unlock_app,
            commands::get_app_version,
            commands::add_provider,
            commands::update_provider,
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
            commands::is_onboarding_completed,
            commands::complete_onboarding,
            commands::get_setting,
            commands::set_setting,
            commands::get_theme,
            commands::set_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
