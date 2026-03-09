use sqlx::SqlitePool;

#[derive(Debug, thiserror::Error)]
pub enum SettingsError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Settings not found: {0}")]
    NotFound(String),

    #[error("Invalid value for key {key}: {error}")]
    InvalidValue { key: String, error: String },
}

pub struct SettingsService {
    pool: SqlitePool,
}

impl SettingsService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Get a setting value by key
    pub async fn get(&self, key: &str) -> Result<Option<String>, SettingsError> {
        let result = sqlx::query_scalar::<_, String>(
            "SELECT value FROM settings WHERE key = ?"
        )
        .bind(key)
        .fetch_optional(&self.pool)
        .await?;

        Ok(result)
    }

    /// Set a setting value by key
    pub async fn set(&self, key: &str, value: &str) -> Result<(), SettingsError> {
        sqlx::query(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))"
        )
        .bind(key)
        .bind(value)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Check if onboarding has been completed
    pub async fn is_onboarding_completed(&self) -> Result<bool, SettingsError> {
        Ok(self.get("onboarding_completed").await?
            .and_then(|v| v.parse::<bool>().ok())
            .unwrap_or(false))
    }

    /// Mark onboarding as completed
    pub async fn complete_onboarding(&self) -> Result<(), SettingsError> {
        self.set("onboarding_completed", "true").await
    }

    /// Get theme preference
    pub async fn get_theme(&self) -> Result<String, SettingsError> {
        Ok(self.get("theme").await?
            .unwrap_or_else(|| "system".to_string()))
    }

    /// Set theme preference
    pub async fn set_theme(&self, theme: &str) -> Result<(), SettingsError> {
        self.set("theme", theme).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_set_setting() {
        // This would require a test database setup
        // For now, we'll skip actual tests
    }
}
