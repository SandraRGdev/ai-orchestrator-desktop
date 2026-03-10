use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ComparisonSession {
    pub id: String,
    pub prompt: String,
    pub created_at: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ComparisonRequest {
    pub prompt: String,
    pub model_configs: Vec<ModelConfig>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ModelConfig {
    pub provider_id: String,
    pub model_id: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateComparisonSession {
    pub prompt: String,
}
