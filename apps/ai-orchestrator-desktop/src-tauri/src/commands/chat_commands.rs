use tauri::State;
use crate::models::message::{SendMessageRequest, Message, CreateMessage, MessageRole};
use crate::database::{MessageRepository, ConversationRepository};
use crate::providers::trait_definition::{PromptRequest, Message as ProviderMessage, MessageRole as ProviderRole};
use crate::services::provider_service::ProviderService;

#[tauri::command]
pub async fn send_message(
    req: SendMessageRequest,
    provider_service: State<'_, tokio::sync::Mutex<ProviderService>>,
    message_repo: State<'_, MessageRepository>,
    conversation_repo: State<'_, ConversationRepository>,
) -> Result<Message, String> {
    // Save user message
    let user_msg = CreateMessage {
        conversation_id: req.conversation_id.clone(),
        role: MessageRole::User,
        content: req.content.clone(),
    };
    message_repo.create(user_msg).await.map_err(|e| e.to_string())?;

    // Get conversation for model info
    let conversation = conversation_repo
        .get_by_id(&req.conversation_id)
        .await
        .map_err(|e| e.to_string())?;

    // Get conversation history
    let history = message_repo
        .list_by_conversation(&req.conversation_id)
        .await
        .map_err(|e| e.to_string())?;

    // Build provider request
    let provider_messages: Vec<ProviderMessage> = history
        .into_iter()
        .map(|m| ProviderMessage {
            role: match m.role {
                MessageRole::System => ProviderRole::System,
                MessageRole::User => ProviderRole::User,
                MessageRole::Assistant => ProviderRole::Assistant,
            },
            content: m.content,
        })
        .collect();

    let provider = provider_service.lock().await;
    let model_provider = provider
        .get_provider(&conversation.provider_id)
        .ok_or("Provider not found")?;

    let prompt_req = PromptRequest {
        model: conversation.model_id.clone(),
        messages: provider_messages,
        temperature: Some(0.7),
        max_tokens: None,
        stream: Some(false),
    };

    // Send to provider
    let response = model_provider
        .send_prompt(prompt_req)
        .await
        .map_err(|e| e.to_string())?;

    // Save assistant message
    let assistant_msg = CreateMessage {
        conversation_id: req.conversation_id.clone(),
        role: MessageRole::Assistant,
        content: response.content.clone(),
    };
    let message = message_repo.create(assistant_msg).await.map_err(|e| e.to_string())?;

    // Update with usage info
    message_repo
        .update_tokens(&message.id, response.usage.total_tokens, response.latency_ms)
        .await
        .map_err(|e| e.to_string())?;

    Ok(message)
}

#[tauri::command]
pub async fn get_conversation_messages(
    conversation_id: String,
    message_repo: State<'_, MessageRepository>,
) -> Result<Vec<Message>, String> {
    message_repo
        .list_by_conversation(&conversation_id)
        .await
        .map_err(|e| e.to_string())
}
