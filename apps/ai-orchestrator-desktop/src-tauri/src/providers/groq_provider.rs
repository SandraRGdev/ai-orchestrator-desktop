use super::trait_definition::*;
use async_trait::async_trait;

pub struct GroqProvider {
    api_key: String,
    client: reqwest::Client,
}

impl GroqProvider {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
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
impl ModelProvider for GroqProvider {
    fn provider_id(&self) -> &'static str {
        "groq"
    }

    fn provider_name(&self) -> &'static str {
        "Groq"
    }

    async fn send_prompt(&self, req: PromptRequest) -> Result<PromptResponse, ProviderError> {
        let start = std::time::Instant::now();

        let response = self.client
            .post("https://api.groq.com/openai/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
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
        Ok(vec![
            ModelInfo {
                id: "llama-3.3-70b-versatile".to_string(),
                name: "Llama 3.3 70B Versatile".to_string(),
                context_length: Some(128000),
                input_cost_per_1k: None,
                output_cost_per_1k: None,
            },
            ModelInfo {
                id: "mixtral-8x7b-32768".to_string(),
                name: "Mixtral 8x7b".to_string(),
                context_length: Some(32768),
                input_cost_per_1k: None,
                output_cost_per_1k: None,
            },
        ])
    }

    async fn validate_api_key(&self, _key: &str) -> Result<bool, ProviderError> {
        // Groq API validation - try to list models
        let response = reqwest::Client::new()
            .get("https://api.groq.com/openai/v1/models")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }
}
