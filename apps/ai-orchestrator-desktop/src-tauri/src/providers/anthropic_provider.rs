use super::trait_definition::*;
use async_trait::async_trait;

pub struct AnthropicProvider {
    api_key: String,
    client: reqwest::Client,
}

impl AnthropicProvider {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }

    fn convert_messages(&self, messages: Vec<Message>) -> Vec<serde_json::Value> {
        messages.into_iter().filter_map(|m| {
            match m.role {
                MessageRole::System => None,
                MessageRole::User => Some(serde_json::json!({
                    "role": "user",
                    "content": m.content,
                })),
                MessageRole::Assistant => Some(serde_json::json!({
                    "role": "assistant",
                    "content": m.content,
                })),
            }
        }).collect()
    }

    fn extract_system_message(&self, messages: Vec<Message>) -> Option<String> {
        messages.into_iter()
            .find(|m| matches!(m.role, MessageRole::System))
            .map(|m| m.content)
    }
}

#[async_trait]
impl ModelProvider for AnthropicProvider {
    fn provider_id(&self) -> &'static str {
        "anthropic"
    }

    fn provider_name(&self) -> &'static str {
        "Anthropic"
    }

    async fn send_prompt(&self, req: PromptRequest) -> Result<PromptResponse, ProviderError> {
        let start = std::time::Instant::now();

        let system_msg = self.extract_system_message(req.messages.clone());
        let messages = self.convert_messages(req.messages);

        let mut body = serde_json::json!({
            "model": req.model,
            "messages": messages,
            "max_tokens": req.max_tokens.unwrap_or(4096),
        });

        if let Some(system) = system_msg {
            body["system"] = serde_json::Value::String(system);
        }

        if let Some(temp) = req.temperature {
            body["temperature"] = serde_json::json!(f64::from(temp));
        }

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await?;

        let latency = start.elapsed().as_millis() as u64;

        if !response.status().is_success() {
            let status = response.status().as_u16();
            let text = response.text().await.unwrap_or_default();
            return Err(ProviderError::Api(format!("HTTP {}: {}", status, text)));
        }

        let json: serde_json::Value = response.json().await?;
        let content = json["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json["usage"].clone();
        let prompt_tokens = usage["input_tokens"].as_u64().unwrap_or(0) as u32;
        let completion_tokens = usage["output_tokens"].as_u64().unwrap_or(0) as u32;

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
        Ok(vec![
            ModelInfo {
                id: "claude-3-5-sonnet-20241022".to_string(),
                name: "Claude 3.5 Sonnet".to_string(),
                context_length: Some(200000),
                input_cost_per_1k: Some(0.003),
                output_cost_per_1k: Some(0.015),
            },
            ModelInfo {
                id: "claude-3-5-haiku-20241022".to_string(),
                name: "Claude 3.5 Haiku".to_string(),
                context_length: Some(200000),
                input_cost_per_1k: Some(0.0008),
                output_cost_per_1k: Some(0.004),
            },
            ModelInfo {
                id: "claude-3-opus-20240229".to_string(),
                name: "Claude 3 Opus".to_string(),
                context_length: Some(200000),
                input_cost_per_1k: Some(0.015),
                output_cost_per_1k: Some(0.075),
            },
        ])
    }

    async fn validate_api_key(&self, key: &str) -> Result<bool, ProviderError> {
        let response = reqwest::Client::new()
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&serde_json::json!({
                "model": "claude-3-5-haiku-20241022",
                "max_tokens": 1,
                "messages": [{"role": "user", "content": "test"}]
            }))
            .send()
            .await?;

        Ok(response.status().is_success() || response.status().as_u16() == 400)
    }
}
