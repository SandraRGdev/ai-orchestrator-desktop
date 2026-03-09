use crate::providers::openai_provider::OpenAIProvider;
use crate::providers::anthropic_provider::AnthropicProvider;
use crate::providers::google_provider::GoogleProvider;
use crate::providers::groq_provider::GroqProvider;
use crate::providers::openrouter_provider::OpenRouterProvider;
use crate::providers::trait_definition::ModelProvider;
use crate::services::keychain_service::KeychainService;
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, ts_rs::TS)]
#[ts(export)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub provider_type: String,
    pub base_url: Option<String>,
    pub enabled: bool,
}

pub struct ProviderService {
    keychain: KeychainService,
    providers: HashMap<String, Arc<dyn ModelProvider>>,
    configs: HashMap<String, ProviderConfig>,
}

impl ProviderService {
    pub fn new() -> Self {
        Self {
            keychain: KeychainService::new(),
            providers: HashMap::new(),
            configs: HashMap::new(),
        }
    }

    pub async fn register_openai(
        &mut self,
        id: String,
        name: String,
        api_key: String,
        base_url: Option<String>,
    ) -> Result<(), ProviderError> {
        let provider = OpenAIProvider::new(api_key.clone(), base_url.clone());
        self.providers.insert(id.clone(), Arc::new(provider));
        self.keychain.store_api_key(&id, &api_key)
            .map_err(|e| ProviderError::Keychain(e.to_string()))?;
        self.configs.insert(id.clone(), ProviderConfig {
            id: id.clone(),
            name,
            provider_type: "openai".to_string(),
            base_url,
            enabled: true,
        });
        Ok(())
    }

    pub async fn register_anthropic(
        &mut self,
        id: String,
        name: String,
        api_key: String,
    ) -> Result<(), ProviderError> {
        let provider = AnthropicProvider::new(api_key.clone());
        self.providers.insert(id.clone(), Arc::new(provider));
        self.keychain.store_api_key(&id, &api_key)
            .map_err(|e| ProviderError::Keychain(e.to_string()))?;
        self.configs.insert(id.clone(), ProviderConfig {
            id: id.clone(),
            name,
            provider_type: "anthropic".to_string(),
            base_url: None,
            enabled: true,
        });
        Ok(())
    }

    pub async fn register_google(
        &mut self,
        id: String,
        name: String,
        api_key: String,
    ) -> Result<(), ProviderError> {
        let provider = GoogleProvider::new(api_key.clone());
        self.providers.insert(id.clone(), Arc::new(provider));
        self.keychain.store_api_key(&id, &api_key)
            .map_err(|e| ProviderError::Keychain(e.to_string()))?;
        self.configs.insert(id.clone(), ProviderConfig {
            id: id.clone(),
            name,
            provider_type: "google".to_string(),
            base_url: None,
            enabled: true,
        });
        Ok(())
    }

    pub async fn register_groq(
        &mut self,
        id: String,
        name: String,
        api_key: String,
    ) -> Result<(), ProviderError> {
        let provider = GroqProvider::new(api_key.clone());
        self.providers.insert(id.clone(), Arc::new(provider));
        self.keychain.store_api_key(&id, &api_key)
            .map_err(|e| ProviderError::Keychain(e.to_string()))?;
        self.configs.insert(id.clone(), ProviderConfig {
            id: id.clone(),
            name,
            provider_type: "groq".to_string(),
            base_url: None,
            enabled: true,
        });
        Ok(())
    }

    pub async fn register_openrouter(
        &mut self,
        id: String,
        name: String,
        api_key: String,
        base_url: Option<String>,
    ) -> Result<(), ProviderError> {
        let provider = OpenRouterProvider::new(api_key.clone(), base_url.clone());
        self.providers.insert(id.clone(), Arc::new(provider));
        self.keychain.store_api_key(&id, &api_key)
            .map_err(|e| ProviderError::Keychain(e.to_string()))?;
        self.configs.insert(id.clone(), ProviderConfig {
            id: id.clone(),
            name,
            provider_type: "openrouter".to_string(),
            base_url,
            enabled: true,
        });
        Ok(())
    }

    pub fn get_provider(&self, id: &str) -> Option<Arc<dyn ModelProvider>> {
        self.providers.get(id).cloned()
    }

    pub fn remove_provider(&mut self, id: &str) -> Result<(), ProviderError> {
        self.providers.remove(id);
        self.configs.remove(id);
        // Try to delete from keychain, but don't fail if entry doesn't exist
        if let Err(e) = self.keychain.delete_api_key(id) {
            println!("Warning: Failed to delete API key from keychain for {}: {}", id, e);
            // Only fail if it's a real error, not "entry not found"
            if !e.to_string().contains("No matching entry") && !e.to_string().contains("not found") {
                return Err(ProviderError::Keychain(e.to_string()));
            }
        }
        Ok(())
    }

    pub fn list_providers(&self) -> Vec<ProviderConfig> {
        self.configs.values().cloned().collect()
    }

    pub async fn load_stored_providers(&mut self, stored: Vec<ProviderConfig>) -> Result<(), ProviderError> {
        for config in stored {
            if !config.enabled {
                self.configs.insert(config.id.clone(), config);
                continue;
            }

            let api_key = self.keychain.get_api_key(&config.id)
                .map_err(|e| ProviderError::Keychain(e.to_string()))?;

            match config.provider_type.as_str() {
                "openai" => {
                    let provider = OpenAIProvider::new(api_key, config.base_url.clone());
                    self.providers.insert(config.id.clone(), Arc::new(provider));
                }
                "anthropic" => {
                    let provider = AnthropicProvider::new(api_key);
                    self.providers.insert(config.id.clone(), Arc::new(provider));
                }
                "google" => {
                    let provider = GoogleProvider::new(api_key);
                    self.providers.insert(config.id.clone(), Arc::new(provider));
                }
                "groq" => {
                    let provider = GroqProvider::new(api_key);
                    self.providers.insert(config.id.clone(), Arc::new(provider));
                }
                "openrouter" => {
                    let provider = OpenRouterProvider::new(api_key, config.base_url.clone());
                    self.providers.insert(config.id.clone(), Arc::new(provider));
                }
                _ => continue,
            }
            self.configs.insert(config.id.clone(), config);
        }
        Ok(())
    }
}

impl Default for ProviderService {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("Keychain error: {0}")]
    Keychain(String),

    #[error("Provider not found: {0}")]
    NotFound(String),

    #[error("Invalid provider type: {0}")]
    InvalidType(String),
}

impl serde::Serialize for ProviderError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
