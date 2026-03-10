use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ComparisonResult {
    pub id: String,
    pub session_id: String,
    pub provider_id: String,
    pub provider_name: String,
    pub model_id: String,
    pub model_name: String,
    pub response: String,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
    pub latency_ms: u64,
    pub cost_usd: f64,
    pub created_at: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateComparisonResult {
    pub session_id: String,
    pub provider_id: String,
    pub provider_name: String,
    pub model_id: String,
    pub model_name: String,
    pub response: String,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
    pub latency_ms: u64,
    pub cost_usd: f64,
}
