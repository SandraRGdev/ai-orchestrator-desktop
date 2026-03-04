---
# Phase 01: Foundation

**Branch**: `feature/foundation` -> `develop` -> `main` (v0.1.0-alpha)
**Version**: v0.1.0-alpha
**Status**: complete
**Priority**: P1
**Effort**: 6h

---

## Context

**Research Reports**:
- [Tauri React Integration](../../reports/researcher-260304-2007-tauri-react-integration.md)
- [Rust Security Research](../../reports/researcher-260304-2007-rust-security.md)

## Overview

Initialize Tauri 2 + React 19 project with core infrastructure, database setup, and shared types. No user-facing features yet.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| sqlx (async) | Matches Tauri's async runtime |
| Custom migrations | Zero external dependencies |
| ts-rs for types | Type-safe IPC boundary |

---

## Files to Create

### Frontend Structure
```
apps/ai-orchestrator-desktop/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── card.tsx
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   ├── stores/
│   │   ├── atoms.ts
│   │   └── providers-atom.ts
│   ├── services/
│   │   └── tauri-service.ts
│   ├── types/
│   │   └── generated.ts       # from ts-rs
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Backend Structure
```
src-tauri/
├── src/
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── app_commands.rs
│   │   └── provider_commands.rs
│   ├── services/
│   │   ├── mod.rs
│   │   ├── database_service.rs
│   │   └── crypto_service.rs
│   ├── database/
│   │   ├── mod.rs
│   │   ├── migrations.rs
│   │   └── connection.rs
│   ├── models/
│   │   ├── mod.rs
│   │   └── provider.rs
│   ├── errors.rs
│   └── main.rs
├── capabilities/
│   └── default.json
├── Cargo.toml
├── tauri.conf.json
└── build.rs
```

### Shared Types
```
src-tauri/shared/
├── Cargo.toml
└── src/
    ├── lib.rs
    ├── models.rs
    ├── errors.rs
    └── events.rs
```

---

## Implementation Steps

### Step 1: Initialize Tauri 2 Project

```bash
cd apps
npm create tauri-app@latest ai-orchestrator-desktop
# Select: React + TypeScript
# Select: Vite
```

### Step 2: Configure Dependencies

**`src-tauri/Cargo.toml`**:
```toml
[dependencies]
tauri = { version = "2", features = ["shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "sqlite", "migrate"] }
tokio = { version = "1", features = ["full"] }
keyring = "3"
argon2 = "0.5"
secrecy = { version = "0.10", features = ["serde"] }
ts-rs = { version = "9", features = ["serde-compat"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "1"

[build-dependencies]
ts-rs = "9"
```

**`package.json`**:
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "jotai": "^2.10.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Step 3: Create Shared Types Module

**`src-tauri/shared/src/models.rs`**:
```rust
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub provider_type: ProviderType,
    pub api_key_encrypted: Option<String>,
    pub base_url: Option<String>,
    pub enabled: bool,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub enum ProviderType {
    OpenAI,
    Anthropic,
    Ollama,
    Custom,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub provider_id: String,
    pub context_length: Option<u32>,
    pub input_cost_per_1k: Option<f64>,
    pub output_cost_per_1k: Option<f64>,
}
```

### Step 4: Database Setup

**`src-tauri/src/database/migrations.rs`**:
```rust
pub const MIGRATIONS: &[(&str, &str)] = &[
    ("001_initial_schema", include_str!("migrations/001_initial_schema.sql")),
    ("002_providers_table", include_str!("migrations/002_providers_table.sql")),
];

pub async fn run_migrations(pool: &sqlx::SqlitePool) -> Result<(), DatabaseError> {
    for (version, sql) in MIGRATIONS {
        // Execute migration
        sqlx::query(sql).execute(pool).await?;
    }
    Ok(())
}
```

**`src-tauri/src/database/migrations/001_initial_schema.sql`**:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    api_key_encrypted BLOB,
    base_url TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    context_length INTEGER,
    input_cost_per_1k REAL,
    output_cost_per_1k REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Step 5: Database Service

**`src-tauri/src/services/database_service.rs`**:
```rust
use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use std::str::FromStr;

pub struct DatabaseService {
    pool: SqlitePool,
}

impl DatabaseService {
    pub async fn new(db_path: &str) -> Result<Self, DatabaseError> {
        let options = SqliteConnectOptions::from_str(db_path)?
            .create_if_missing(true);

        let pool = SqlitePool::connect_with(options).await?;

        // Enable WAL mode for better concurrency
        sqlx::query("PRAGMA journal_mode=WAL")
            .execute(&pool)
            .await?;

        // Run migrations
        crate::database::migrations::run_migrations(&pool).await?;

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
```

### Step 6: Crypto Service

**`src-tauri/src/services/crypto_service.rs`**:
```rust
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{SaltString, rand_core::OsRng};
use secrecy::{Secret, ExposeSecret};

pub struct CryptoService {
    master_key: Option<Secret<[u8; 32]>>,
}

impl CryptoService {
    pub fn new() -> Self {
        Self { master_key: None }
    }

    pub fn unlock(&mut self, password: &str) -> Result<(), CryptoError> {
        // Derive key from password using Argon2
        let params = argon2::Params::new(65536, 3, 2, None)?;
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

        let salt = SaltString::generate(&mut OsRng);
        let mut key = [0u8; 32];
        argon2.hash_password_into(password.as_bytes(), salt.as_bytes(), &mut key)?;

        self.master_key = Some(Secret::new(key));
        Ok(())
    }

    pub fn encrypt(&self, plaintext: &str) -> Result<Vec<u8>, CryptoError> {
        let key = self.master_key.as_ref()
            .ok_or(CryptoError::Locked)?;
        // AES-256-GCM encryption
        // Implementation details...
        Ok(vec![])
    }

    pub fn decrypt(&self, ciphertext: &[u8]) -> Result<Secret<String>, CryptoError> {
        let key = self.master_key.as_ref()
            .ok_or(CryptoError::Locked)?;
        // AES-256-GCM decryption
        Ok(Secret::new(String::new()))
    }
}
```

### Step 7: Basic Commands

**`src-tauri/src/commands/app_commands.rs`**:
```rust
use tauri::State;
use crate::services::crypto_service::CryptoService;
use crate::services::database_service::DatabaseService;

#[tauri::command]
pub async fn unlock_app(
    password: String,
    crypto: State<'_, CryptoService>,
) -> Result<(), String> {
    let mut crypto = crypto.lock().await;
    crypto.unlock(&password)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}
```

### Step 8: Frontend Setup

**`src/stores/atoms.ts`**:
```typescript
import { atom } from 'jotai';

// App state
export const appUnlockedAtom = atom(false);
export const appVersionAtom = atom('0.1.0-alpha');

// Providers state
export const providersAtom = atom<ProviderConfig[]>([]);
export const selectedProviderAtom = atom<string | null>(null);

// UI state
export const sidebarOpenAtom = atom(true);
export const currentViewAtom = atom<'chat' | 'compare' | 'agents'>('chat');
```

**`src/services/tauri-service.ts`**:
```typescript
import { invoke } from '@tauri-apps/api/core';

export class TauriService {
  async unlockApp(password: string): Promise<void> {
    return invoke('unlock_app', { password });
  }

  async getAppVersion(): Promise<string> {
    return invoke('get_app_version');
  }
}

export const tauriService = new TauriService();
```

### Step 9: Build Script

**`src-tauri/build.rs`**:
```rust
fn main() {
    ts_rs::export!()
        .with_cfg(|cfg| cfg
            .output_dir("../src/types")
            .format(ts_rs::typescript::DefinitionFormat::Module))
        .expect("Failed to generate TypeScript types");
}
```

---

## Todo Checklist

- [x] Initialize Tauri 2 + React 19 project
- [x] Configure Cargo.toml dependencies
- [x] Configure package.json dependencies
- [x] Create shared types module with ts-rs
- [x] Set up SQLx with SQLite
- [x] Create migration runner
- [x] Write initial database schema migrations
- [x] Implement DatabaseService
- [x] Implement CryptoService with XOR (temporary)
- [x] Create basic Tauri commands (unlock, version)
- [x] Set up Jotai atoms for state
- [x] Create TauriService wrapper
- [x] Configure Tailwind CSS
- [x] Build basic layout (sidebar + main)
- [x] Test `npm run tauri:dev`

---

## Success Criteria

- [x] `npm run tauri:dev` launches without errors
- [x] SQLite database created in app data directory
- [x] TypeScript types generated from Rust via ts-rs
- [x] Basic UI shell renders (sidebar + content area)
- [x] Can call `get_app_version` from frontend
- [x] All files < 200 lines

---

## Git Flow

```bash
# Create feature branch
git checkout develop
git checkout -b feature/foundation

# After implementation
git add apps/ai-orchestrator-desktop
git commit -m "feat(desktop): initialize Tauri 2 + React 19 foundation

- Set up project structure
- Configure sqlx with SQLite
- Implement crypto service
- Create shared types with ts-rs
- Set up Jotai state management

Version: v0.1.0-alpha"

# Merge to develop
git checkout develop
git merge --no-ff feature/foundation

# Tag alpha release
git tag -a v0.1.0-alpha -m "Alpha release: foundation"
```

---

## Next Steps

After this phase:
- [Phase 02: Provider System](./phase-02-provider-system.md)
