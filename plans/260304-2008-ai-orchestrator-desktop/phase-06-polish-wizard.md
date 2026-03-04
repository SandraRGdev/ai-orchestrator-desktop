---
# Phase 06: Polish & Wizard

**Branch**: `feature/polish-wizard` -> `develop` -> `main` (v0.4.0)
**Version**: v0.4.0
**Status**: pending
**Priority**: P2
**Effort**: 6h
**Dependencies**: Phase 01, Phase 02

---

## Context

**Research Reports**:
- [Brainstorm Report](../../reports/brainstorm-260304-1957-ai-orchestrator-desktop-architecture.md)

## Overview

Onboarding wizard for first-time setup, error handling improvements, keyboard shortcuts, and UI polish. Makes the app production-ready.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Skip wizard after first run | Better UX for returning users |
| Modal-based wizard | Familiar pattern |
| Global error boundary | Catch all React errors |
| Keyboard shortcuts | Power user efficiency |

---

## Files to Create

### Backend
```
src-tauri/src/
├── commands/
│   ├── onboarding_commands.rs
│   └── settings_commands.rs
├── services/
│   └── settings_service.rs
└── database/
    └── migrations/
        └── 010_settings.sql
```

### Frontend
```
src/
├── components/
│   ├── onboarding/
│   │   ├── onboarding-wizard.tsx
│   │   ├── welcome-step.tsx
│   │   ├── provider-setup-step.tsx
│   │   ├── master-password-step.tsx
│   │   └── completion-step.tsx
│   ├── ui/
│   │   ├── error-boundary.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── toast.tsx
│   │   └── keyboard-shortcuts.tsx
│   └── layout/
│       ├── command-palette.tsx
│       └── shortcuts-help.tsx
├── hooks/
│   ├── use-keyboard-shortcuts.ts
│   └── use-onboarding.ts
├── stores/
│   └── settings-atom.ts
└── styles/
    └── themes.css
```

---

## Implementation Steps

### Step 1: Settings Migration

**`src-tauri/src/database/migrations/010_settings.sql`**:
```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Onboarding completion flag
INSERT OR IGNORE INTO settings (key, value) VALUES ('onboarding_completed', '0');
```

### Step 2: Settings Service

**`src-tauri/src/services/settings_service.rs`**:
```rust
use sqlx::SqlitePool;

pub struct SettingsService {
    pool: SqlitePool,
}

impl SettingsService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>, SettingsError> {
        let result = sqlx::query_scalar::<_, String>(
            "SELECT value FROM settings WHERE key = ?"
        )
        .bind(key)
        .fetch_optional(&self.pool)
        .await?;

        Ok(result)
    }

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

    pub async fn is_onboarding_completed(&self) -> Result<bool, SettingsError> {
        Ok(self.get("onboarding_completed").await?
            .and_then(|v| v.parse::<bool>().ok())
            .unwrap_or(false))
    }

    pub async fn complete_onboarding(&self) -> Result<(), SettingsError> {
        self.set("onboarding_completed", "1").await
    }
}
```

### Step 3: Onboarding Commands

**`src-tauri/src/commands/onboarding_commands.rs`**:
```rust
use tauri::State;
use crate::services::settings_service::SettingsService;

#[tauri::command]
pub async fn is_onboarding_completed(
    settings: State<'_, SettingsService>,
) -> Result<bool, String> {
    settings.is_onboarding_completed()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn complete_onboarding(
    settings: State<'_, SettingsService>,
) -> Result<(), String> {
    settings.complete_onboarding()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_setting(
    key: String,
    value: String,
    settings: State<'_, SettingsService>,
) -> Result<(), String> {
    settings.set(&key, &value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_setting(
    key: String,
    settings: State<'_, SettingsService>,
) -> Result<Option<String>, String> {
    settings.get(&key)
        .map_err(|e| e.to_string())
}
```

### Step 4: Onboarding Wizard Component

**`src/components/onboarding/onboarding-wizard.tsx`**:
```typescript
import { useState } from 'react';
import { useAtom } from 'jotai';
import { WelcomeStep } from './welcome-step';
import { MasterPasswordStep } from './master-password-step';
import { ProviderSetupStep } from './provider-setup-step';
import { CompletionStep } from './completion-step';

type Step = 'welcome' | 'password' | 'providers' | 'complete';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [masterPassword, setMasterPassword] = useState('');
  const [providers, setProviders] = useState<any[]>([]);

  const steps: Step[] = ['welcome', 'password', 'providers', 'complete'];
  const currentIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    const nextStep = steps[currentIndex + 1];
    if (nextStep) setCurrentStep(nextStep);
  };

  const handleBack = () => {
    const prevStep = steps[currentIndex - 1];
    if (prevStep) setCurrentStep(prevStep);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Progress bar */}
        <div className="border-b">
          <div className="flex justify-between px-6 py-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 ${
                    index < currentIndex ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6">
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={handleNext} />
          )}

          {currentStep === 'password' && (
            <MasterPasswordStep
              onNext={(password) => {
                setMasterPassword(password);
                handleNext();
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 'providers' && (
            <ProviderSetupStep
              onNext={(configuredProviders) => {
                setProviders(configuredProviders);
                handleNext();
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 'complete' && (
            <CompletionStep
              onComplete={onComplete}
              providers={providers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

**`src/components/onboarding/welcome-step.tsx`**:
```typescript
interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold">Welcome to AI Orchestrator</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Your desktop app for AI model orchestration, comparison, and multi-agent workflows.
      </p>

      <div className="grid grid-cols-3 gap-4 my-8">
        <div className="p-4 border rounded-lg">
          <div className="text-2xl mb-2">💬</div>
          <h3 className="font-semibold">Chat</h3>
          <p className="text-sm text-gray-500">Single or multi-model conversations</p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="text-2xl mb-2">⚖️</div>
          <h3 className="font-semibold">Compare</h3>
          <p className="text-sm text-gray-500">Side-by-side model comparison</p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-semibold">Agents</h3>
          <p className="text-sm text-gray-500">Multi-agent workflow automation</p>
        </div>
      </div>

      <button onClick={onNext} className="px-8 py-2 bg-blue-500 text-white rounded-lg">
        Get Started
      </button>
    </div>
  );
}
```

**`src/components/onboarding/master-password-step.tsx`**:
```typescript
import { useState } from 'react';

interface MasterPasswordStepProps {
  onNext: (password: string) => void;
  onBack: () => void;
}

export function MasterPasswordStep({ onNext, onBack }: MasterPasswordStepProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    onNext(password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">Create Master Password</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This password encrypts your API keys. Don't lose it - it cannot be recovered.
      </p>

      <div>
        <label>Master Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div>
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          required
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onBack} variant="secondary">
          Back
        </button>
        <button type="submit">
          Continue
        </button>
      </div>
    </form>
  );
}
```

### Step 5: Error Boundary

**`src/components/ui/error-boundary.tsx`**:
```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-gray-600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 6: Keyboard Shortcuts Hook

**`src/hooks/use-keyboard-shortcuts.ts`**:
```typescript
import { useEffect } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global shortcuts
export const globalShortcuts = [
  { key: 'k', ctrl: true, description: 'Open command palette' },
  { key: '/', description: 'Focus search' },
  { key: 'n', ctrl: true, description: 'New conversation' },
  { key: 'b', ctrl: true, description: 'Toggle sidebar' },
  { key: '?', description: 'Show keyboard shortcuts' },
];
```

### Step 7: Command Palette

**`src/components/layout/command-palette.tsx`**:
```typescript
import { useState, useEffect } from 'react';

interface Command {
  id: string;
  label: string;
  action: () => void;
  icon?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    { id: 'new-chat', label: 'New Conversation', action: () => {}, icon: '💬' },
    { id: 'compare', label: 'Compare Models', action: () => {}, icon: '⚖️' },
    { id: 'agents', label: 'Open Agent Workspace', action: () => {}, icon: '🤖' },
    { id: 'settings', label: 'Settings', action: () => {}, icon: '⚙️' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-xl">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full px-4 py-3 border-b rounded-t-lg"
          autoFocus
        />

        <div className="max-h-64 overflow-y-auto">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
            >
              {cmd.icon && <span>{cmd.icon}</span>}
              <span>{cmd.label}</span>
            </button>
          ))}
        </div>

        <div className="border-t px-4 py-2 text-sm text-gray-500 flex justify-between">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
```

### Step 8: Onboarding Hook

**`src/hooks/use-onboarding.ts`**:
```typescript
import { useEffect, useState } from 'react';
import { tauriService } from '@/services/tauri-service';

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    tauriService.isOnboardingCompleted().then(completed => {
      setNeedsOnboarding(!completed);
      setIsLoading(false);
    });
  }, []);

  const completeOnboarding = async () => {
    await tauriService.completeOnboarding();
    setNeedsOnboarding(false);
  };

  return { isLoading, needsOnboarding, completeOnboarding };
}
```

### Step 9: Update App Root

**`src/App.tsx`**:
```typescript
import { ErrorBoundary } from './components/ui/error-boundary';
import { OnboardingWizard } from './components/onboarding/onboarding-wizard';
import { CommandPalette } from './components/layout/command-palette';
import { useOnboarding } from './hooks/use-onboarding';

function App() {
  const { isLoading, needsOnboarding, completeOnboarding } = useOnboarding();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <CommandPalette />

      {needsOnboarding ? (
        <OnboardingWizard onComplete={completeOnboarding} />
      ) : (
        // Main app content
        <div>{/* Existing app content */}</div>
      )}
    </ErrorBoundary>
  );
}

export default App;
```

### Step 10: Theme Styles

**`src/styles/themes.css`**:
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --bg-tertiary: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
}

.dark {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border-color: #374151;
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.2s, color 0.2s;
}
```

---

## Todo Checklist

- [ ] Create settings table migration
- [ ] Implement SettingsService
- [ ] Create is_onboarding_completed command
- [ ] Create complete_onboarding command
- [ ] Build OnboardingWizard component
- [ ] Build WelcomeStep component
- [ ] Build MasterPasswordStep component
- [ ] Build ProviderSetupStep component
- [ ] Build CompletionStep component
- [ ] Implement ErrorBoundary
- [ ] Create useKeyboardShortcuts hook
- [ ] Build CommandPalette component
- [ ] Build ShortcutsHelp component
- [ ] Create useOnboarding hook
- [ ] Update App.tsx with onboarding flow
- [ ] Add dark/light theme support
- [ ] Test onboarding flow end-to-end

---

## Success Criteria

- [ ] First-time users see wizard on launch
- [ ] Returning users skip wizard
- [ ] Master password created and stored
- [ ] At least one provider configured
- [ ] Command palette opens with Cmd/Ctrl+K
- [ ] Errors caught by boundary
- [ ] Theme toggle persists
- [ ] All shortcuts documented

---

## Git Flow

```bash
# Create feature branch
git checkout develop
git checkout -b feature/polish-wizard

# After implementation
git add apps/ai-orchestrator-desktop
git commit -m "feat(desktop): add onboarding wizard and UI polish

- Implement onboarding wizard with multi-step flow
- Add master password creation step
- Add provider setup step
- Implement command palette (Cmd/Ctrl+K)
- Add error boundary for crash handling
- Add keyboard shortcuts help
- Implement dark/light theme support

Version: v0.4.0"

# Merge to develop
git checkout develop
git merge --no-ff feature/polish-wizard

# Tag release
git tag -a v0.4.0 -m "Release v0.4.0: polish and wizard"
```

---

## Summary: Complete Implementation

All 6 phases complete:

| Version | Feature | Status |
|---------|---------|--------|
| v0.1.0-alpha | Foundation | pending |
| v0.1.0-beta | Provider System | pending |
| v0.1.0 | Single Chat | pending |
| v0.2.0 | Comparison Mode | pending |
| v0.3.0 | Multi-Agent Workflows | pending |
| v0.4.0 | Polish & Wizard | pending |

---

## Unresolved Questions

- UI component library: shadcn/ui, custom, or other?
- Streaming support: priority for v0.5.0?
- Cost calculation accuracy needs?
- Multi-language support?
