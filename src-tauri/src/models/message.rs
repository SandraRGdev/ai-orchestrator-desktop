use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: MessageRole,
    pub content: String,
    pub tokens: Option<u32>,
    pub latency_ms: Option<u64>,
    pub created_at: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub enum MessageRole {
    System,
    User,
    Assistant,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateMessage {
    pub conversation_id: String,
    pub role: MessageRole,
    pub content: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct SendMessageRequest {
    pub conversation_id: String,
    pub content: String,
}
