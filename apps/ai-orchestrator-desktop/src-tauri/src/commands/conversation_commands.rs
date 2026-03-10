use tauri::State;
use crate::models::conversation::{Conversation, CreateConversation, UpdateConversationTitle};
use crate::database::ConversationRepository;

#[tauri::command]
pub async fn create_conversation(
    req: CreateConversation,
    repo: State<'_, ConversationRepository>,
) -> Result<Conversation, String> {
    repo.create(req)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_conversation(
    id: String,
    repo: State<'_, ConversationRepository>,
) -> Result<Conversation, String> {
    repo.get_by_id(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_conversations(
    repo: State<'_, ConversationRepository>,
) -> Result<Vec<Conversation>, String> {
    repo.list_all()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_conversation(
    id: String,
    repo: State<'_, ConversationRepository>,
) -> Result<(), String> {
    repo.delete(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_conversation_title(
    id: String,
    req: UpdateConversationTitle,
    repo: State<'_, ConversationRepository>,
) -> Result<Conversation, String> {
    repo.update_title(&id, req)
        .await
        .map_err(|e| e.to_string())
}
