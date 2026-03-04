use serde::{Deserialize, Serialize};
use ts_rs::TS;
use chrono::{DateTime, Utc};

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub model_id: String,
    pub provider_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateConversation {
    pub title: String,
    pub model_id: String,
    pub provider_id: String,
}
