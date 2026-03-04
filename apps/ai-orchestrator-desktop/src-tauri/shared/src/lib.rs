use ts_rs::TS;

#[derive(TS, serde::Serialize, serde::Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub provider_type: ProviderType,
    pub api_key_encrypted: Option<String>,
    pub base_url: Option<String>,
    pub enabled: bool,
}

#[derive(TS, serde::Serialize, serde::Deserialize, Clone, Debug)]
#[ts(export)]
pub enum ProviderType {
    OpenAI,
    Anthropic,
    Ollama,
    Custom,
}

#[derive(TS, serde::Serialize, serde::Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub provider_id: String,
    pub context_length: Option<u32>,
    pub input_cost_per_1k: Option<f64>,
    pub output_cost_per_1k: Option<f64>,
}

#[derive(TS, serde::Serialize, serde::Deserialize, Clone, Debug)]
#[ts(export)]
pub struct AppError {
    pub code: String,
    pub message: String,
}
