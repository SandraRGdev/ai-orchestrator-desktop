---
# Phase 03: Single Chat

**Branch**: `feature/single-chat` -> `develop` -> `main` (v0.1.0)
**Version**: v0.1.0
**Status**: complete
**Priority**: P1
**Effort**: 8h
**Dependencies**: Phase 01, Phase 02

---

## Context

**Research Reports**:
- [Brainstorm Report](../../reports/brainstorm-260304-1957-ai-orchestrator-desktop-architecture.md)
- [Tauri React Research](../../reports/researcher-260304-2007-tauri-react-integration.md)

## Overview

Implement single-model chat interface with conversation persistence, streaming responses (optional), and message history. First complete user-facing feature.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Repository pattern | Clean separation of data access |
| Streaming optional | Can add post-MVP |
| Conversation threading | Future-proof for multi-compare |

---

## Files to Create

### Backend
```
src-tauri/src/
├── services/
│   ├── conversation_service.rs
│   └── message_service.rs
├── database/
│   └── repositories/
│       ├── conversation_repository.rs
│       └── message_repository.rs
├── commands/
│   ├── conversation_commands.rs
│   └── chat_commands.rs
└── models/
    ├── conversation.rs
    └── message.rs
```

### Frontend
```
src/
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx
│   │   ├── message-list.tsx
│   │   ├── message-bubble.tsx
│   │   ├── chat-input.tsx
│   │   └── model-selector.tsx
│   └── conversations/
│       ├── conversation-list.tsx
│       ├── conversation-item.tsx
│       └── new-conversation-button.tsx
├── stores/
│   ├── conversation-atom.ts
│   └── message-atom.ts
└── services/
    └── chat-service.ts
```

---

## Implementation Steps

### Step 1: Database Migrations

**`src-tauri/src/database/migrations/003_conversations.sql`**:
```sql
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
```

**`src-tauri/src/database/migrations/004_messages.sql`**:
```sql
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens INTEGER,
    latency_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
```

### Step 2: Define Models

**`src-tauri/src/models/conversation.rs`**:
```rust
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use chrono::{DateTime, Utc};

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub model_id: String,
    pub provider_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateConversation {
    pub title: String,
    pub model_id: String,
    pub provider_id: String,
}
```

**`src-tauri/src/models/message.rs`**:
```rust
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use chrono::{DateTime, Utc};

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: MessageRole,
    pub content: String,
    pub tokens: Option<u32>,
    pub latency_ms: Option<u64>,
    pub created_at: DateTime<Utc>,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub enum MessageRole {
    System,
    User,
    Assistant,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct CreateMessage {
    pub conversation_id: String,
    pub role: MessageRole,
    pub content: String,
}

#[derive(TS, Serialize, Deserialize, Clone, Debug)]
#[ts(export)]
pub struct SendMessageRequest {
    pub conversation_id: String,
    pub content: String,
}
```

### Step 3: Conversation Repository

**`src-tauri/src/database/repositories/conversation_repository.rs`**:
```rust
use crate::models::conversation::{Conversation, CreateConversation};
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct ConversationRepository {
    pool: SqlitePool,
}

impl ConversationRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateConversation) -> Result<Conversation, RepositoryError> {
        let id = Uuid::new_v4().to_string();

        sqlx::query!(
            r#"
            INSERT INTO conversations (id, title, model_id, provider_id)
            VALUES (?, ?, ?, ?)
            "#,
            id, req.title, req.model_id, req.provider_id
        )
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Conversation, RepositoryError> {
        let row = sqlx::query_as!(
            Conversation,
            r#"SELECT id, title, model_id as "model_id!", provider_id as "provider_id!",
                      created_at as "created_at!", updated_at as "updated_at!"
               FROM conversations WHERE id = ?"#,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(row)
    }

    pub async fn list_all(&self) -> Result<Vec<Conversation>, RepositoryError> {
        let conversations = sqlx::query_as!(
            Conversation,
            r#"SELECT id, title, model_id as "model_id!", provider_id as "provider_id!",
                      created_at as "created_at!", updated_at as "updated_at!"
               FROM conversations ORDER BY created_at DESC"#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(conversations)
    }

    pub async fn delete(&self, id: &str) -> Result<(), RepositoryError> {
        sqlx::query!("DELETE FROM conversations WHERE id = ?", id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
```

### Step 4: Message Repository

**`src-tauri/src/database/repositories/message_repository.rs`**:
```rust
use crate::models::message::{Message, CreateMessage, MessageRole};
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct MessageRepository {
    pool: SqlitePool,
}

impl MessageRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateMessage) -> Result<Message, RepositoryError> {
        let id = Uuid::new_v4().to_string();

        sqlx::query!(
            r#"
            INSERT INTO messages (id, conversation_id, role, content)
            VALUES (?, ?, ?, ?)
            "#,
            id,
            req.conversation_id,
            format!("{:?}", req.role),
            req.content
        )
        .execute(&self.pool)
        .await?;

        self.get_by_id(&id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Message, RepositoryError> {
        let row = sqlx::query_as!(
            Message,
            r#"SELECT id, conversation_id as "conversation_id!",
                      role, content, tokens, latency_ms,
                      created_at as "created_at!"
               FROM messages WHERE id = ?"#,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(row)
    }

    pub async fn list_by_conversation(&self, conversation_id: &str) -> Result<Vec<Message>, RepositoryError> {
        let messages = sqlx::query_as!(
            Message,
            r#"SELECT id, conversation_id as "conversation_id!",
                      role, content, tokens, latency_ms,
                      created_at as "created_at!"
               FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"#,
            conversation_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(messages)
    }

    pub async fn update_tokens(&self, id: &str, tokens: u32, latency_ms: u64) -> Result<(), RepositoryError> {
        sqlx::query!(
            "UPDATE messages SET tokens = ?, latency_ms = ? WHERE id = ?",
            tokens as i32,
            latency_ms as i64,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
```

### Step 5: Chat Commands

**`src-tauri/src/commands/chat_commands.rs`**:
```rust
use tauri::State;
use crate::models::message::{SendMessageRequest, Message, MessageRole};
use crate::database::repositories::{MessageRepository, ConversationRepository};
use crate::providers::trait_definition::{PromptRequest, Message as ProviderMessage, MessageRole as ProviderRole};

#[tauri::command]
pub async fn send_message(
    req: SendMessageRequest,
    provider_service: State<'_, ProviderService>,
    message_repo: State<'_, MessageRepository>,
    conversation_repo: State<'_, ConversationRepository>,
) -> Result<Message, String> {
    // Save user message
    let user_msg = CreateMessage {
        conversation_id: req.conversation_id.clone(),
        role: MessageRole::User,
        content: req.content.clone(),
    };
    message_repo.create(user_msg).await.map_err(|e| e.to_string())?;

    // Get conversation for model info
    let conversation = conversation_repo
        .get_by_id(&req.conversation_id)
        .await
        .map_err(|e| e.to_string())?;

    // Get conversation history
    let history = message_repo
        .list_by_conversation(&req.conversation_id)
        .await
        .map_err(|e| e.to_string())?;

    // Build provider request
    let provider_messages: Vec<ProviderMessage> = history
        .into_iter()
        .map(|m| ProviderMessage {
            role: match m.role {
                MessageRole::System => ProviderRole::System,
                MessageRole::User => ProviderRole::User,
                MessageRole::Assistant => ProviderRole::Assistant,
            },
            content: m.content,
        })
        .collect();

    let provider = provider_service.lock().await;
    let model_provider = provider
        .get_provider(&conversation.provider_id)
        .ok_or("Provider not found")?;

    let prompt_req = PromptRequest {
        model: conversation.model_id.clone(),
        messages: provider_messages,
        temperature: Some(0.7),
        max_tokens: None,
        stream: Some(false),
    };

    // Send to provider
    let response = model_provider
        .send_prompt(prompt_req)
        .await
        .map_err(|e| e.to_string())?;

    // Save assistant message
    let assistant_msg = CreateMessage {
        conversation_id: req.conversation_id.clone(),
        role: MessageRole::Assistant,
        content: response.content.clone(),
    };
    let message = message_repo.create(assistant_msg).await.map_err(|e| e.to_string())?;

    // Update with usage info
    message_repo
        .update_tokens(&message.id, response.usage.total_tokens, response.latency_ms)
        .await
        .map_err(|e| e.to_string())?;

    Ok(message)
}

#[tauri::command]
pub async fn get_conversation_messages(
    conversation_id: String,
    message_repo: State<'_, MessageRepository>,
) -> Result<Vec<Message>, String> {
    message_repo
        .list_by_conversation(&conversation_id)
        .await
        .map_err(|e| e.to_string())
}
```

### Step 6: Frontend Chat Components

**`src/components/chat/chat-interface.tsx`**:
```typescript
import { useAtom, useAtomAction } from 'jotai';
import { messagesAtom, sendMessageAtom } from '@/stores/message-atom';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';

interface ChatInterfaceProps {
  conversationId: string;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages] = useAtom(messagesAtom);
  const sendMessage = useAtomAction(sendMessageAtom);

  const handleSend = (content: string) => {
    sendMessage({ conversationId, content });
  };

  return (
    <div className="flex flex-col h-screen">
      <MessageList messages={messages[conversationId] || []} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
```

**`src/components/chat/message-bubble.tsx`**:
```typescript
import { Message, MessageRole } from '@/types/generated';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === MessageRole.User;
  const isSystem = message.role === MessageRole.System;

  if (isSystem) {
    return (
      <div className="text-center text-sm text-gray-500 py-2">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-2xl px-4 py-2 rounded-lg ${
        isUser
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-900'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.tokens && (
          <div className="text-xs mt-1 opacity-70">
            {message.tokens} tokens
            {message.latencyMs && ` • ${message.latencyMs}ms`}
          </div>
        )}
      </div>
    </div>
  );
}
```

**`src/components/chat/chat-input.tsx`**:
```typescript
import { useState } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Send a message..."
          className="flex-1 resize-none border rounded-lg px-3 py-2"
          rows={1}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !input.trim()}>
          Send
        </button>
      </div>
    </form>
  );
}
```

### Step 7: Message Atoms

**`src/stores/message-atom.ts`**:
```typescript
import { atom } from 'jotai';
import { atomWithMutation } from 'jotai-tanstack-query';
import { Message, SendMessageRequest } from '@/types/generated';
import { tauriService } from '@/services/tauri-service';

export const messagesAtom = atom<Record<string, Message[]>>({});

export const sendMessageAtom = atomWithMutation(() => ({
  mutationKey: ['sendMessage'],
  mutationFn: async (req: SendMessageRequest) => {
    return tauriService.sendMessage(req);
  },
}));
```

---

## Todo Checklist

- [x] Create conversations table migration
- [x] Create messages table migration
- [x] Define Conversation and Message models
- [x] Implement ConversationRepository
- [x] Implement MessageRepository
- [x] Create send_message command
- [x] Create get_conversation_messages command
- [x] Create ChatInterface component
- [x] Create MessageBubble component
- [x] Create ChatInput component with Enter-to-send
- [x] Create MessageList component
- [x] Set up message atoms with Jotai
- [x] Add conversation loading
- [x] Test message persistence
- [x] Test provider integration

---

## Success Criteria

- [x] Can create new conversation
- [x] Can send message and receive response
- [x] Messages persist across app restarts
- [x] Can view conversation history
- [x] Shows token count and latency
- [x] Enter sends, Shift+Enter for newline

---

## Git Flow

```bash
# Create feature branch
git checkout develop
git checkout -b feature/single-chat

# After implementation
git add apps/ai-orchestrator-desktop
git commit -m "feat(desktop): implement single chat interface

- Add conversation and message models
- Implement repository pattern for data access
- Create send_message command with provider integration
- Build chat UI with message list and input
- Add conversation persistence

Version: v0.1.0"

# Merge to develop
git checkout develop
git merge --no-ff feature/single-chat

# Merge to main and tag v0.1.0
git checkout main
git merge --no-ff develop
git tag -a v0.1.0 -m "Release v0.1.0: MVP with single chat"
```

---

## Next Steps

After this phase:
- [Phase 04: Comparison Mode](./phase-04-comparison-mode.md)
