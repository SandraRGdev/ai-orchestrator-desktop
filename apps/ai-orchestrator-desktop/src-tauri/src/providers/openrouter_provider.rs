use super::trait_definition::*;
use async_trait::async_trait;

pub struct OpenRouterProvider {
    api_key: String,
    base_url: String,
    client: reqwest::Client,
}

impl OpenRouterProvider {
    pub fn new(api_key: String, base_url: Option<String>) -> Self {
        Self {
            api_key,
            base_url: base_url.unwrap_or_else(|| "https://openrouter.ai/api/v1".to_string()),
            client: reqwest::Client::new(),
        }
    }

    fn convert_messages(&self, messages: Vec<Message>) -> Vec<serde_json::Value> {
        messages.into_iter().map(|m| {
            serde_json::json!({
                "role": match m.role {
                    MessageRole::System => "system",
                    MessageRole::User => "user",
                    MessageRole::Assistant => "assistant",
                },
                "content": m.content,
            })
        }).collect()
    }
}

#[async_trait]
impl ModelProvider for OpenRouterProvider {
    fn provider_id(&self) -> &'static str {
        "openrouter"
    }

    fn provider_name(&self) -> &'static str {
        "OpenRouter"
    }

    async fn send_prompt(&self, req: PromptRequest) -> Result<PromptResponse, ProviderError> {
        let start = std::time::Instant::now();

        let response = self.client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("HTTP-Referer", "https://ai-orchestrator.app")
            .header("X-Title", "AI Orchestrator")
            .json(&serde_json::json!({
                "model": req.model,
                "messages": self.convert_messages(req.messages),
                "temperature": req.temperature.unwrap_or(0.7),
                "max_tokens": req.max_tokens,
            }))
            .send()
            .await?;

        let latency = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let status = response.status().as_u16();
            let text = response.text().await.unwrap_or_default();
            return Err(ProviderError::Api(format!("HTTP {}: {}", status, text)));
        }

        let json: serde_json::Value = response.json().await?;
        let choice = json["choices"][0].clone();

        let content = choice["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json["usage"].clone();
        let prompt_tokens = usage["prompt_tokens"].as_u64().unwrap_or(0) as u32;
        let completion_tokens = usage["completion_tokens"].as_u64().unwrap_or(0) as u32;

        Ok(PromptResponse {
            content,
            model: req.model,
            usage: Usage {
                prompt_tokens,
                completion_tokens,
                total_tokens: prompt_tokens + completion_tokens,
            },
            latency_ms: latency,
        })
    }

    async fn list_models(&self) -> Result<Vec<ModelInfo>, ProviderError> {
        // Popular OpenRouter models (verified IDs)
        Ok(vec![
            ModelInfo {
                id: "anthropic/claude-3.5-sonnet".to_string(),
                name: "Claude 3.5 Sonnet".to_string(),
                context_length: Some(200000),
                input_cost_per_1k: Some(0.003),
                output_cost_per_1k: Some(0.015),
            },
            ModelInfo {
                id: "anthropic/claude-3.5-sonnet:beta".to_string(),
                name: "Claude 3.5 Sonnet (Beta)".to_string(),
                context_length: Some(200000),
                input_cost_per_1k: Some(0.003),
                output_cost_per_1k: Some(0.015),
            },
            ModelInfo {
                id: "anthropic/claude-3-opus".to_string(),
                name: "Claude 3 Opus".to_string(),
                context_length: Some(200000),
                input_cost_per_1k: Some(0.015),
                output_cost_per_1k: Some(0.075),
            },
            ModelInfo {
                id: "openai/gpt-4o".to_string(),
                name: "GPT-4o".to_string(),
                context_length: Some(128000),
                input_cost_per_1k: Some(0.005),
                output_cost_per_1k: Some(0.015),
            },
            ModelInfo {
                id: "openai/gpt-4o-mini".to_string(),
                name: "GPT-4o Mini".to_string(),
                context_length: Some(128000),
                input_cost_per_1k: Some(0.00015),
                output_cost_per_1k: Some(0.0006),
            },
            ModelInfo {
                id: "google/gemini-pro-1.5".to_string(),
                name: "Gemini Pro 1.5".to_string(),
                context_length: Some(1000000),
                input_cost_per_1k: Some(0.00125),
                output_cost_per_1k: Some(0.005),
            },
            ModelInfo {
                id: "meta-llama/llama-3.1-405b-instruct".to_string(),
                name: "Llama 3.1 405B Instruct".to_string(),
                context_length: Some(131072),
                input_cost_per_1k: Some(0.0027),
                output_cost_per_1k: Some(0.0027),
            },
            ModelInfo {
                id: "meta-llama/llama-3.1-70b-instruct".to_string(),
                name: "Llama 3.1 70B Instruct".to_string(),
                context_length: Some(131072),
                input_cost_per_1k: Some(0.00059),
                output_cost_per_1k: Some(0.00079),
            },
            ModelInfo {
                id: "mistralai/mistral-large".to_string(),
                name: "Mistral Large".to_string(),
                context_length: Some(128000),
                input_cost_per_1k: Some(0.004),
                output_cost_per_1k: Some(0.012),
            },
        ])
    }

    async fn validate_api_key(&self, key: &str) -> Result<bool, ProviderError> {
        let response = reqwest::Client::new()
            .get(format!("{}/models", self.base_url))
            .header("Authorization", format!("Bearer {}", key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }
}
