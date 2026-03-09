use super::trait_definition::*;
use async_trait::async_trait;

pub struct GoogleProvider {
    api_key: String,
    client: reqwest::Client,
}

impl GoogleProvider {
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
                    MessageRole::System => "user",
                    MessageRole::User => "user",
                    MessageRole::Assistant => "model",
                },
                "parts": [{"text": m.content}],
            })
        }).collect()
    }
}

#[async_trait]
impl ModelProvider for GoogleProvider {
    fn provider_id(&self) -> &'static str {
        "google"
    }

    fn provider_name(&self) -> &'static str {
        "Google"
    }

    async fn send_prompt(&self, req: PromptRequest) -> Result<PromptResponse, ProviderError> {
        let start = std::time::Instant::now();

        // Build request body for logging
        let request_body = serde_json::json!({
            "contents": self.convert_messages(req.messages),
            "generationConfig": {
                "temperature": req.temperature.unwrap_or(0.7),
                "maxOutputTokens": req.max_tokens,
            }
        });

        let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}", req.model, self.api_key);

        println!("[GoogleProvider] Request URL: {}", url);
        println!("[GoogleProvider] Request body: {}", serde_json::to_string_pretty(&request_body).unwrap_or_default());

        let response = self.client
            .post(&url)
            .json(&request_body)
            .send()
            .await?;

        let latency = start.elapsed().as_millis() as u64;

        println!("[GoogleProvider] Response status: {}", response.status());

        if !response.status().is_success() {
            let status = response.status().as_u16();
            let text = response.text().await.unwrap_or_default();
            println!("[GoogleProvider] Error response: {}", text);
            return Err(ProviderError::Api(format!("HTTP {}: {}", status, text)));
        }

        let json: serde_json::Value = response.json().await?;
        let content = json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json["usageMetadata"].clone();
        let prompt_tokens = usage["promptTokenCount"].as_u64().unwrap_or(0) as u32;
        let completion_tokens = usage["candidatesTokenCount"].as_u64().unwrap_or(0) as u32;

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
                id: "gemini-2.0-flash-exp".to_string(),
                name: "Gemini 2.0 Flash (Exp)".to_string(),
                context_length: Some(1000000),
                input_cost_per_1k: Some(0.0),
                output_cost_per_1k: Some(0.0),
            },
            ModelInfo {
                id: "gemini-1.5-flash-002".to_string(),
                name: "Gemini 1.5 Flash".to_string(),
                context_length: Some(1000000),
                input_cost_per_1k: Some(0.0),
                output_cost_per_1k: Some(0.0),
            },
            ModelInfo {
                id: "gemini-1.5-flash-8b-latest".to_string(),
                name: "Gemini 1.5 Flash 8B".to_string(),
                context_length: Some(1000000),
                input_cost_per_1k: Some(0.0),
                output_cost_per_1k: Some(0.0),
            },
            ModelInfo {
                id: "gemini-1.5-pro-002".to_string(),
                name: "Gemini 1.5 Pro".to_string(),
                context_length: Some(2000000),
                input_cost_per_1k: Some(0.0),
                output_cost_per_1k: Some(0.0),
            },
        ])
    }

    async fn validate_api_key(&self, _key: &str) -> Result<bool, ProviderError> {
        // Google API validation - try to list models
        let response = self.client
            .get(format!("https://generativelanguage.googleapis.com/v1beta/models?key={}", self.api_key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }
}
