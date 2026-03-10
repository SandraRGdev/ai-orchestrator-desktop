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

    fn candidate_models(model: &str) -> Vec<String> {
        let mut candidates = vec![model.to_string()];

        if model == "gemini-1.5-flash-002" {
            candidates.push("gemini-1.5-flash-latest".to_string());
            candidates.push("gemini-1.5-flash".to_string());
        }

        if model.ends_with("-002") {
            candidates.push(model.replacen("-002", "-latest", 1));
            candidates.push(model.replacen("-002", "", 1));
        }

        let mut unique = Vec::new();
        for candidate in candidates {
            if !unique.contains(&candidate) {
                unique.push(candidate);
            }
        }
        unique
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
        let request_contents = self.convert_messages(req.messages.clone());
        let fallback_models = Self::candidate_models(&req.model);
        let mut last_error = String::new();

        for model in fallback_models {
            let request_body = serde_json::json!({
                "contents": request_contents.clone(),
                "generationConfig": {
                    "temperature": req.temperature.unwrap_or(0.7),
                    "maxOutputTokens": req.max_tokens,
                }
            });

            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                model,
                self.api_key
            );

            println!("[GoogleProvider] Request URL: {}", url);
            println!("[GoogleProvider] Request body: {}", serde_json::to_string_pretty(&request_body).unwrap_or_default());

            let response = self.client
                .post(&url)
                .json(&request_body)
                .send()
                .await?;

            println!("[GoogleProvider] Response status: {}", response.status());

            if !response.status().is_success() {
                let status = response.status().as_u16();
                let text = response.text().await.unwrap_or_default();
                println!("[GoogleProvider] Error response: {}", text);

                // Try fallback model only when Google returns model-not-found.
                if status == 404 {
                    last_error = format!("HTTP {}: {}", status, text);
                    continue;
                }

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

            return Ok(PromptResponse {
                content,
                model,
                usage: Usage {
                    prompt_tokens,
                    completion_tokens,
                    total_tokens: prompt_tokens + completion_tokens,
                },
                latency_ms: start.elapsed().as_millis() as u64,
            });
        }

        Err(ProviderError::Api(if last_error.is_empty() {
            "No compatible Gemini model found".to_string()
        } else {
            last_error
        }))
    }

    async fn list_models(&self) -> Result<Vec<ModelInfo>, ProviderError> {
        let response = self.client
            .get(format!("https://generativelanguage.googleapis.com/v1beta/models?key={}", self.api_key))
            .send()
            .await?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await?;
            let mut models = Vec::new();

            if let Some(items) = json.get("models").and_then(|v| v.as_array()) {
                for item in items {
                    let supports_generate = item
                        .get("supportedGenerationMethods")
                        .and_then(|v| v.as_array())
                        .map(|methods| methods.iter().any(|m| m.as_str() == Some("generateContent")))
                        .unwrap_or(false);

                    if !supports_generate {
                        continue;
                    }

                    let name = item.get("name").and_then(|v| v.as_str()).unwrap_or_default();
                    let id = name.strip_prefix("models/").unwrap_or(name).to_string();
                    let display_name = item
                        .get("displayName")
                        .and_then(|v| v.as_str())
                        .map(|v| v.to_string())
                        .unwrap_or_else(|| id.clone());
                    let context_length = item
                        .get("inputTokenLimit")
                        .and_then(|v| v.as_u64())
                        .and_then(|v| u32::try_from(v).ok());

                    if !id.is_empty() {
                        models.push(ModelInfo {
                            id,
                            name: display_name,
                            context_length,
                            input_cost_per_1k: None,
                            output_cost_per_1k: None,
                        });
                    }
                }
            }

            if !models.is_empty() {
                return Ok(models);
            }
        }

        Ok(vec![
            ModelInfo {
                id: "gemini-1.5-flash-latest".to_string(),
                name: "Gemini 1.5 Flash".to_string(),
                context_length: Some(1_000_000),
                input_cost_per_1k: None,
                output_cost_per_1k: None,
            },
            ModelInfo {
                id: "gemini-1.5-flash-8b-latest".to_string(),
                name: "Gemini 1.5 Flash 8B".to_string(),
                context_length: Some(1_000_000),
                input_cost_per_1k: None,
                output_cost_per_1k: None,
            },
            ModelInfo {
                id: "gemini-1.5-pro-latest".to_string(),
                name: "Gemini 1.5 Pro".to_string(),
                context_length: Some(2_000_000),
                input_cost_per_1k: None,
                output_cost_per_1k: None,
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
