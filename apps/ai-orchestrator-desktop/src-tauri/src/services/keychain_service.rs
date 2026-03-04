use keyring::Entry;
use std::sync::Mutex;

pub struct KeychainService {
    _priv: (),
}

impl KeychainService {
    pub fn new() -> Self {
        Self { _priv: () }
    }

    fn get_entry(&self, provider_id: &str) -> Result<Entry, KeychainError> {
        Entry::new("ai-orchestrator", provider_id)
            .map_err(KeychainError::from)
    }

    pub fn store_api_key(&self, provider_id: &str, key: &str) -> Result<(), KeychainError> {
        let entry = self.get_entry(provider_id)?;
        entry.set_password(key)
            .map_err(KeychainError::from)?;
        Ok(())
    }

    pub fn get_api_key(&self, provider_id: &str) -> Result<String, KeychainError> {
        let entry = self.get_entry(provider_id)?;
        let key = entry.get_password()
            .map_err(KeychainError::from)?;
        Ok(key)
    }

    pub fn delete_api_key(&self, provider_id: &str) -> Result<(), KeychainError> {
        let entry = self.get_entry(provider_id)?;
        entry.delete_credential()
            .map_err(KeychainError::from)?;
        Ok(())
    }

    pub fn has_api_key(&self, provider_id: &str) -> bool {
        self.get_api_key(provider_id).is_ok()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum KeychainError {
    #[error("Keyring error: {0}")]
    Keyring(#[from] keyring::Error),

    #[error("No stored key for provider")]
    NotFound,
}

impl serde::Serialize for KeychainError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
