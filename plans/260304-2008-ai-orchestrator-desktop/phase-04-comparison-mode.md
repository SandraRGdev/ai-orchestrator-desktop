---
# Phase 04: Comparison Mode

**Branch**: `feature/comparison-mode` -> `develop` -> `main` (v0.2.0)
**Version**: v0.2.0
**Status**: pending
**Priority**: P1
**Effort**: 10h
**Dependencies**: Phase 01, Phase 02, Phase 03

---

## Context

**Research Reports**:
- [Brainstorm Report](../../reports/brainstorm-260304-1957-ai-orchestrator-desktop-architecture.md)

## Overview

Implement parallel model comparison with side-by-side responses, metrics visualization (latency, tokens, cost), and comparison session persistence.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Parallel execution with tokio | Efficient multi-provider calls |
| Comparison session entity | Separate from conversations |
| Metrics dashboard | Visual comparison of performance |
| Diff highlighting | Help users compare outputs |

---

## Files to Create

### Backend
```
src-tauri/src/
├── services/
│   ├── comparison_service.rs    # Parallel executor
│   └── metrics_service.rs        # Cost calculation
├── database/
│   ├── migrations/
│   │   ├── 005_comparison_sessions.sql
│   │   └── 006_comparison_results.sql
│   └── repositories/
│       ├── comparison_repository.rs
│       └── comparison_result_repository.rs
├── commands/
│   └── comparison_commands.rs
└── models/
    ├── comparison_session.rs
    └── comparison_result.rs
```

### Frontend
```
src/
├── components/
│   ├── comparison/
│   │   ├── comparison-view.tsx
│   │   ├── comparison-input.tsx
│   │   ├── result-panel.tsx
│   │   ├── metrics-card.tsx
│   │   ├── model-selector-multi.tsx
│   │   └── diff-viewer.tsx
│   └── ui/
│       ├── badge.tsx
│       └── progress-bar.tsx
├── stores/
│   └── comparison-atom.ts
└── services/
    └── comparison-service.ts
```

---

## Implementation Steps

### Step 1: Database Migrations

**`src-tauri/src/database/migrations/005_comparison_sessions.sql`**:
```sql
CREATE TABLE IF NOT EXISTS comparison_sessions (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**`src-tauri/src/database/migrations/006_comparison_results.sql`**:
```sql
CREATE TABLE IF NOT EXISTS comparison_results (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES comparison_sessions(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    response TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    latency_ms INTEGER,
    cost_usd REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comparison_results_session
    ON comparison_results(session_id);
```

### Step 2: Define Models

**`src-tauri/src/models/comparison_session.rs`**:
```rust
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use chrono::{DateTime, Utc};

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ComparisonSession {
    pub id: String,
    pub prompt: String,
    pub created_at: DateTime<Utc>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ComparisonRequest {
    pub prompt: String,
    pub model_configs: Vec<ModelConfig>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ModelConfig {
    pub provider_id: String,
    pub model_id: String,
}
```

**`src-tauri/src/models/comparison_result.rs`**:
```rust
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use chrono::{DateTime, Utc};

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct ComparisonResult {
    pub id: String,
    pub session_id: String,
    pub provider_id: String,
    pub provider_name: String,
    pub model_id: String,
    pub model_name: String,
    pub response: String,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
    pub latency_ms: u64,
    pub cost_usd: f64,
    pub created_at: DateTime<Utc>,
}
```

### Step 3: Comparison Service

**`src-tauri/src/services/comparison_service.rs`**:
```rust
use crate::models::comparison_session::{ComparisonRequest, ModelConfig};
use crate::models::comparison_result::ComparisonResult;
use crate::providers::trait_definition::{PromptRequest, Message as ProviderMessage, MessageRole};
use std::sync::Arc;
use std::collections::HashMap;

pub struct ComparisonService {
    providers: HashMap<String, Arc<dyn ModelProvider>>,
}

impl ComparisonService {
    pub fn new() -> Self {
        Self {
            providers: HashMap::new(),
        }
    }

    pub fn register_provider(&mut self, id: String, provider: Arc<dyn ModelProvider>) {
        self.providers.insert(id, provider);
    }

    pub async fn execute_comparison(&self, req: ComparisonRequest)
        -> Result<Vec<ComparisonResult>, ComparisonError>
    {
        let mut tasks = Vec::new();

        for config in &req.model_configs {
            if let Some(provider) = self.providers.get(&config.provider_id) {
                let provider = provider.clone();
                let prompt = req.prompt.clone();
                let model_id = config.model_id.clone();
                let provider_id = config.provider_id.clone();

                tasks.push(tokio::spawn(async move {
                    Self::execute_single(provider, provider_id, model_id, prompt).await
                }));
            }
        }

        let results = futures::future::join_all(tasks)
            .await
            .into_iter()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| ComparisonError::Execution(e.to_string()))?;

        Ok(results.into_iter().collect::<Result<Vec<_>, _>>()?)
    }

    async fn execute_single(
        provider: Arc<dyn ModelProvider>,
        provider_id: String,
        model_id: String,
        prompt: String,
    ) -> Result<ComparisonResult, ComparisonError> {
        let start = std::time::Instant::now();

        let request = PromptRequest {
            model: model_id.clone(),
            messages: vec![
                ProviderMessage {
                    role: MessageRole::User,
                    content: prompt.clone(),
                }
            ],
            temperature: Some(0.7),
            max_tokens: None,
            stream: Some(false),
        };

        let response = provider.send_prompt(request).await?;
        let latency = start.elapsed().as_millis() as u64;

        // Calculate cost based on provider pricing
        let cost_usd = Self::calculate_cost(
            &provider_id,
            &model_id,
            response.usage.prompt_tokens,
            response.usage.completion_tokens,
        );

        Ok(ComparisonResult {
            id: uuid::Uuid::new_v4().to_string(),
            session_id: String::new(), // Set by caller
            provider_id: provider_id.clone(),
            provider_name: provider.provider_name().to_string(),
            model_id: model_id.clone(),
            model_name: model_id.clone(),
            response: response.content,
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
            latency_ms: latency,
            cost_usd: cost_usd,
            created_at: chrono::Utc::now(),
        })
    }

    fn calculate_cost(provider_id: &str, model_id: &str, prompt_tokens: u32, completion_tokens: u32) -> f64 {
        // Pricing lookup per provider/model
        // For now, return placeholder
        0.0
    }
}
```

### Step 4: Comparison Commands

**`src-tauri/src/commands/comparison_commands.rs`**:
```rust
use tauri::State;
use crate::models::comparison_session::{ComparisonRequest, ComparisonSession};
use crate::models::comparison_result::ComparisonResult;
use crate::services::comparison_service::ComparisonService;
use crate::database::repositories::{ComparisonRepository, ComparisonResultRepository};

#[tauri::command]
pub async fn run_comparison(
    req: ComparisonRequest,
    comparison_service: State<'_, ComparisonService>,
    result_repo: State<'_, ComparisonResultRepository>,
) -> Result<Vec<ComparisonResult>, String> {
    // Create session
    let session = ComparisonSession {
        id: uuid::Uuid::new_v4().to_string(),
        prompt: req.prompt.clone(),
        created_at: chrono::Utc::now(),
    };

    // Execute comparison
    let mut results = comparison_service
        .execute_comparison(req)
        .await
        .map_err(|e| e.to_string())?;

    // Save results with session_id
    for result in &mut results {
        result.session_id = session.id.clone();
        result_repo.create(result.clone()).await
            .map_err(|e| e.to_string())?;
    }

    Ok(results)
}

#[tauri::command]
pub async fn list_comparison_sessions(
    repo: State<'_, ComparisonRepository>,
) -> Result<Vec<ComparisonSession>, String> {
    repo.list_all().await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_comparison_results(
    session_id: String,
    repo: State<'_, ComparisonResultRepository>,
) -> Result<Vec<ComparisonResult>, String> {
    repo.list_by_session(&session_id).await
        .map_err(|e| e.to_string())
}
```

### Step 5: Frontend Comparison View

**`src/components/comparison/comparison-view.tsx`**:
```typescript
import { useState } from 'react';
import { useAtom } from 'jotai';
import { ComparisonInput } from './comparison-input';
import { ResultPanel } from './result-panel';
import { comparisonResultsAtom } from '@/stores/comparison-atom';

export function ComparisonView() {
  const [results, setResults] = useAtom(comparisonResultsAtom);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleCompare = async (prompt: string, models: ModelConfig[]) => {
    const response = await tauriService.runComparison({
      prompt,
      modelConfigs: models,
    });
    setResults(response);
  };

  return (
    <div className="flex flex-col h-screen">
      <ComparisonInput onCompare={handleCompare} />

      {results.length > 0 && (
        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          {results.map((result) => (
            <ResultPanel key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**`src/components/comparison/result-panel.tsx`**:
```typescript
import { ComparisonResult } from '@/types/generated';
import { MetricsCard } from './metrics-card';

interface ResultPanelProps {
  result: ComparisonResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <div>
          <div className="font-semibold">{result.providerName}</div>
          <div className="text-sm text-gray-600">{result.modelName}</div>
        </div>
      </div>

      <div className="p-4">
        <div className="prose max-w-none mb-4 whitespace-pre-wrap">
          {result.response}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricsCard
            label="Latency"
            value={`${result.latencyMs}ms`}
          />
          <MetricsCard
            label="Tokens"
            value={result.totalTokens.toString()}
          />
          <MetricsCard
            label="Prompt"
            value={result.promptTokens.toString()}
          />
          <MetricsCard
            label="Completion"
            value={result.completionTokens.toString()}
          />
        </div>

        {result.costUsd > 0 && (
          <div className="mt-2 text-sm text-green-600">
            Cost: ${result.costUsd.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
}
```

**`src/components/comparison/comparison-input.tsx`**:
```typescript
import { useState } from 'react';
import { useAtom } from 'jotai';
import { providersAtom } from '@/stores/provider-atom';

interface ComparisonInputProps {
  onCompare: (prompt: string, models: ModelConfig[]) => void;
}

export function ComparisonInput({ onCompare }: ComparisonInputProps) {
  const [providers] = useAtom(providersAtom);
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

  const availableModels = providers.flatMap(p =>
    p.models.map(m => ({ ...m, providerId: p.id, providerName: p.name }))
  );

  const handleModelToggle = (modelId: string) => {
    const newSelected = new Set(selectedModels);
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId);
    } else {
      newSelected.add(modelId);
    }
    setSelectedModels(newSelected);
  };

  const handleCompare = () => {
    const models = availableModels
      .filter(m => selectedModels.has(m.id))
      .map(m => ({ providerId: m.providerId, modelId: m.id }));

    if (models.length >= 2 && prompt.trim()) {
      onCompare(prompt.trim(), models);
    }
  };

  return (
    <div className="border-b p-4 space-y-4">
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Enter prompt to compare across models..."
        className="w-full border rounded-lg p-3"
        rows={3}
      />

      <div>
        <label className="text-sm font-medium">Select models to compare (min 2):</label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {availableModels.map(model => (
            <label key={model.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedModels.has(model.id)}
                onChange={() => handleModelToggle(model.id)}
              />
              <span className="text-sm">{model.name}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={selectedModels.size < 2 || !prompt.trim()}
      >
        Compare ({selectedModels.size} models)
      </button>
    </div>
  );
}
```

### Step 6: Metrics Card Component

**`src/components/comparison/metrics-card.tsx`**:
```typescript
interface MetricsCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function MetricsCard({ label, value, highlight }: MetricsCardProps) {
  return (
    <div className={`border rounded px-3 py-2 ${highlight ? 'bg-green-50 border-green-200' : ''}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
```

---

## Todo Checklist

- [ ] Create comparison_sessions table
- [ ] Create comparison_results table
- [ ] Define ComparisonSession and ComparisonResult models
- [ ] Implement ComparisonService with parallel execution
- [ ] Implement ComparisonRepository
- [ ] Implement ComparisonResultRepository
- [ ] Create run_comparison command
- [ ] Create list_comparison_sessions command
- [ ] Create get_comparison_results command
- [ ] Build ComparisonView component
- [ ] Build ResultPanel component
- [ ] Build ComparisonInput component
- [ ] Build MetricsCard component
- [ ] Add model selector for multi-select
- [ ] Test parallel execution with 3+ providers

---

## Success Criteria

- [ ] Can select 2+ models for comparison
- [ ] Executes all providers in parallel
- [ ] Shows results side-by-side
- [ ] Displays latency, tokens, cost metrics
- [ ] Comparison sessions persist
- [ ] Can view historical comparisons
- [ ] < 2s total time for 3 models

---

## Git Flow

```bash
# Create feature branch
git checkout develop
git checkout -b feature/comparison-mode

# After implementation
git add apps/ai-orchestrator-desktop
git commit -m "feat(desktop): implement parallel model comparison

- Add comparison session and result models
- Implement parallel execution with tokio
- Create side-by-side comparison UI
- Add metrics visualization (latency, tokens, cost)
- Support comparison session persistence

Version: v0.2.0"

# Merge to develop
git checkout develop
git merge --no-ff feature/comparison-mode

# Tag release
git tag -a v0.2.0 -m "Release v0.2.0: comparison mode"
```

---

## Next Steps

After this phase:
- [Phase 05: Multi-Agent Workflows](./phase-05-multi-agent.md)
