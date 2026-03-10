use crate::models::comparison_session::{ComparisonRequest, ModelConfig};
use crate::models::comparison_result::ComparisonResult;
use crate::providers::trait_definition::{PromptRequest, Message as ProviderMessage, MessageRole, ModelProvider};
use std::sync::Arc;
use uuid::Uuid;

pub struct ComparisonService {
    providers: Vec<Arc<dyn ModelProvider + Send + Sync>>,
}

impl ComparisonService {
    pub fn new() -> Self {
        Self {
            providers: Vec::new(),
        }
    }

    pub fn register_provider(&mut self, provider: Arc<dyn ModelProvider + Send + Sync>) {
        self.providers.push(provider);
    }

    pub async fn execute_comparison(
        &self,
        req: ComparisonRequest,
        session_id: String,
    ) -> Result<Vec<ComparisonResult>, ComparisonError> {
        let mut tasks = Vec::new();

        for config in &req.model_configs {
            // Find matching provider by provider_id
            for provider in &self.providers {
                if provider.provider_id() == config.provider_id {
                    let provider = provider.clone();
                    let prompt = req.prompt.clone();
                    let model_id = config.model_id.clone();
                    let provider_id = config.provider_id.clone();
                    let session_id = session_id.clone();

                    tasks.push(tokio::spawn(async move {
                        Self::execute_single(provider, provider_id, model_id, prompt, session_id).await
                    }));
                    break;
                }
            }
        }

        let results = futures::future::join_all(tasks)
            .await
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| ComparisonError::Execution(e.to_string()))?;

        Ok(results.into_iter().collect::<Result<Vec<_>, _>>()?)
    }

    async fn execute_single(
        provider: Arc<dyn ModelProvider + Send + Sync>,
        provider_id: String,
        model_id: String,
        prompt: String,
        session_id: String,
    ) -> Result<ComparisonResult, ComparisonError> {
        let start = std::time::Instant::now();

        let request = PromptRequest {
            model: model_id.clone(),
            messages: vec![ProviderMessage {
                role: MessageRole::User,
                content: prompt.clone(),
            }],
            temperature: Some(0.7),
            max_tokens: None,
            stream: Some(false),
        };

        let response = provider.send_prompt(request).await
            .map_err(|e| ComparisonError::ProviderError(provider_id.clone(), e.to_string()))?;

        let latency_ms = start.elapsed().as_millis() as u64;

        // Calculate cost (placeholder - can be enhanced with real pricing data)
        let cost_usd = Self::calculate_cost(&provider_id, &model_id, response.usage.prompt_tokens, response.usage.completion_tokens);

        Ok(ComparisonResult {
            id: Uuid::new_v4().to_string(),
            session_id,
            provider_id: provider_id.clone(),
            provider_name: provider.provider_name().to_string(),
            model_id: model_id.clone(),
            model_name: model_id.clone(),
            response: response.content,
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
            latency_ms,
            cost_usd,
            created_at: chrono::Utc::now().to_rfc3339(),
        })
    }

    fn calculate_cost(_provider_id: &str, _model_id: &str, prompt_tokens: u32, completion_tokens: u32) -> f64 {
        // TODO: Implement real cost calculation based on provider/model pricing
        // For now, return a placeholder cost
        let prompt_cost = (prompt_tokens as f64) / 1000.0 * 0.0001;
        let completion_cost = (completion_tokens as f64) / 1000.0 * 0.0002;
        prompt_cost + completion_cost
    }
}

impl Default for ComparisonService {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ComparisonError {
    #[error("Execution error: {0}")]
    Execution(String),

    #[error("Provider {0} error: {1}")]
    ProviderError(String, String),

    #[error("No providers available")]
    NoProviders,
}

impl serde::Serialize for ComparisonError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
