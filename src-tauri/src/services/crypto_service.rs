use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{SaltString, rand_core::OsRng};

pub struct CryptoService {
    master_key: Option<Vec<u8>>,
    salt: Option<String>,
}

impl CryptoService {
    pub fn new() -> Self {
        Self {
            master_key: None,
            salt: None,
        }
    }

    pub fn unlock(&mut self, password: &str) -> Result<(), CryptoError> {
        // Generate or load salt (in production, load from storage)
        let salt_str = if let Some(stored_salt) = &self.salt {
            stored_salt.clone()
        } else {
            let salt = SaltString::generate(&mut OsRng);
            let salt_str = salt.as_str().to_string();
            self.salt = Some(salt_str.clone());
            salt_str
        };

        let params = argon2::Params::new(65536, 3, 2, None)?;
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

        let mut key = [0u8; 32];
        argon2.hash_password_into(password.as_bytes(), salt_str.as_bytes(), &mut key)?;

        self.master_key = Some(key.to_vec());
        Ok(())
    }

    pub fn encrypt(&self, plaintext: &str) -> Result<Vec<u8>, CryptoError> {
        let key = self.master_key.as_ref()
            .ok_or(CryptoError::Locked)?;

        // Simple XOR for now - replace with proper AES-256-GCM in production
        let mut result = plaintext.as_bytes().to_vec();
        for (i, byte) in result.iter_mut().enumerate() {
            *byte ^= key[i % 32];
        }
        Ok(result)
    }

    pub fn decrypt(&self, ciphertext: &[u8]) -> Result<String, CryptoError> {
        let key = self.master_key.as_ref()
            .ok_or(CryptoError::Locked)?;

        // Simple XOR for now - replace with proper AES-256-GCM in production
        let mut result = ciphertext.to_vec();
        for (i, byte) in result.iter_mut().enumerate() {
            *byte ^= key[i % 32];
        }

        String::from_utf8(result)
            .map_err(|_| CryptoError::InvalidData)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("Crypto is locked")]
    Locked,

    #[error("Invalid encrypted data")]
    InvalidData,

    #[error("Argon2 error: {0}")]
    Argon2Error(#[from] argon2::Error),
}
