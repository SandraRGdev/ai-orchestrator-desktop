use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export)]
pub struct PromptRequest {
    pub model: String,
    pub messages: Vec<Message>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export)]
pub struct Message {
    pub role: MessageRole,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export)]
pub enum MessageRole {
    System,
    User,
    Assistant,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export)]
pub struct PromptResponse {
    pub content: String,
    pub model: String,
    pub usage: Usage,
    pub latency_ms: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export)]
pub struct Usage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_length: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_cost_per_1k: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_cost_per_1k: Option<f64>,
}

#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("API error: {0}")]
    Api(String),

    #[error("Invalid response")]
    InvalidResponse,
}

impl serde::Serialize for ProviderError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[async_trait]
pub trait ModelProvider: Send + Sync {
    fn provider_id(&self) -> &'static str;
    fn provider_name(&self) -> &'static str;

    async fn send_prompt(&self, req: PromptRequest)
        -> Result<PromptResponse, ProviderError>;

    async fn list_models(&self)
        -> Result<Vec<ModelInfo>, ProviderError>;

    async fn validate_api_key(&self, key: &str)
        -> Result<bool, ProviderError>;
}
