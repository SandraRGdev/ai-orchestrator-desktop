# AI Orchestrator Desktop - Changelog

**Last Updated**: 2026-03-04
**Current Version**: v0.3.0
**Application Location**: `apps/ai-orchestrator-desktop/`

All notable changes to the AI Orchestrator Desktop application will be documented in this file.

## [v0.3.0] - 2026-03-04

### Added - Multi-Agent Workflows (Phase 05)

#### Multi-Agent Execution Engine
- **Sequential Flow Pattern**: Agents execute in order, passing output as input to next agent
- **Parallel Flow Pattern**: Multiple agents execute simultaneously with same input
- **Evaluator Flow Pattern**: Multiple agents provide responses, evaluator agent selects best result
- **DAG-based Execution**: Topological sorting for complex workflow dependencies
- **Execution Tracking**: Persistent logs with token usage and latency metrics per node

#### Agent Definition System
- **4 Preset Agents**:
  - Researcher: Conducts thorough research with citations
  - Writer: Creates well-written content
  - Analyst: Analyzes data and provides insights
  - Evaluator: Evaluates and selects best responses
- **Custom Agent Creation**: JSON Schema validated agent definitions
- **Agent Types**: Researcher, Writer, Analyst, Evaluator, Custom
- **Agent Configuration**: System prompt, temperature, max tokens, model binding, tools

#### Database Schema (3 New Migrations)
- **agents table**: Store agent definitions (preset and custom)
- **workflows table**: Store workflow DAG structures
- **workflow_executions table**: Track execution history with results

#### Backend (Rust)
- **6 New Models**:
  - `AgentDefinition`: Agent configuration and metadata
  - `AgentConfig`: System prompt, temperature, model settings
  - `Workflow`: DAG structure with nodes and dependencies
  - `WorkflowNode`: Individual workflow step with agent binding
  - `WorkflowExecution`: Execution record with status tracking
  - `WorkflowResult`: Aggregated results with node outputs

- **11 New Tauri Commands**:
  - `list_preset_agents`: Get built-in agent definitions
  - `create_custom_agent`: Create user-defined agent
  - `list_agents`: Get all configured agents
  - `get_agent`: Get specific agent details
  - `update_agent`: Modify agent configuration
  - `delete_agent`: Remove agent definition
  - `create_workflow`: Create workflow from nodes
  - `list_workflows`: Get all workflows
  - `get_workflow`: Get specific workflow
  - `execute_workflow`: Execute workflow with input
  - `get_workflow_executions`: Get execution history

- **AgentExecutor**: Core execution engine with 3 flow patterns
- **AgentRegistry**: Manage agent definitions
- **AgentRepository**: Database operations for agents
- **WorkflowRepository**: Database operations for workflows
- **WorkflowExecutionRepository**: Track execution history

#### Frontend (React)
- **AgentWorkspace**: Main multi-agent workspace component
- **WorkflowBuilder**: Visual workflow construction UI
- **AgentSelector**: Choose from preset/custom agents
- **ExecutionLog**: Real-time execution monitoring with node results
- **PresetAgentsList**: Display and select preset agents
- **CustomAgentForm**: Create custom agent definitions
- **FlowVisualization**: Visual representation of workflow DAG
- **Jotai Atoms**: State management for agents, workflows, executions

#### Security & Validation
- JSON Schema validation for custom agent definitions
- Type-safe Rust/TypeScript boundary via ts-rs
- Secure provider integration via existing ModelProvider trait

#### Documentation
- [Phase 05 Implementation Plan](../plans/260304-2008-ai-orchestrator-desktop/phase-05-multi-agent.md)
- Updated system architecture with multi-agent components
- Updated codebase summary with Phase 05 features

### Technical Details
- **Backend**: Rust with async/await, tokio for concurrent execution
- **Database**: SQLite with sqlx async integration
- **Frontend**: React 19 with Jotai state management
- **Type Safety**: ts-rs generates TypeScript types from Rust structs
- **Build Status**:
  - `cargo check` passes with 28 warnings (mostly unused code)
  - `npm run build` succeeds
  - All TypeScript types generated

### Success Criteria Met
- Can create custom agent with system prompt
- Can build sequential workflow with 2+ agents
- Can build parallel workflow with 2+ agents
- Can build evaluator workflow
- Execution records persisted to database
- Can view execution logs with node results
- Shows tokens and latency per node

---

## [v0.2.0] - 2026-03-04

### Added - Comparison Mode (Phase 04)

#### Parallel Model Execution
- Execute multiple AI models simultaneously with same prompt
- Side-by-side response comparison UI
- Cost tracking per model (input + output tokens)
- Latency measurement per model

#### Backend
- **2 New Models**:
  - `ComparisonRequest`: Request to compare multiple models
  - `ComparisonResult`: Aggregated results with per-model data
- **3 New Tauri Commands**:
  - `compare_models`: Execute parallel comparison
  - `get_comparison_history`: Retrieve past comparisons
  - `delete_comparison`: Remove comparison record

#### Frontend
- `ComparisonView`: Side-by-side model comparison interface
- `ComparisonResults`: Display results with metrics
- `ModelSelector`: Select models for comparison
- `CostBreakdown`: Show token costs per model

#### Database
- **comparisons table**: Store comparison requests and results
- **comparison_results table**: Store per-model responses

### Success Criteria Met
- Can select 2+ models for comparison
- Parallel execution completes < 2 seconds
- Cost and latency tracked per model
- Results persisted to database

---

## [v0.1.0] - 2026-03-04

### Added - Foundation & Single Chat (Phase 01-03)

#### Foundation (Phase 01)
- Tauri 2 project setup with React 19 + Vite
- SQLite database with sqlx async integration
- Database migrations system (6 initial migrations)
- Error handling with thiserror
- Cross-platform project structure

#### Provider System (Phase 02)
- **ModelProvider Trait**: Extensible async trait for AI providers
  - `send_prompt()`: Execute prompts with messages
  - `list_models()`: Retrieve available models
  - `validate_api_key()`: Verify API credentials
- **Provider Implementations**:
  - OpenAI Provider (GPT-4, GPT-3.5)
  - Anthropic Provider (Claude 3 Opus, Sonnet, Haiku)
- **Security**:
  - OS keychain integration via `keyring` crate
  - Secure API key storage per provider
  - Cross-platform credential management (Windows, macOS, Linux)
- **Provider Service**:
  - Provider registry with CRUD operations
  - API key validation
  - Model listing support

#### Single Chat (Phase 03)
- Single-model chat interface
- Message history persistence
- Streaming response support (optional)
- Model selection UI
- Provider management UI

#### Database Schema (6 Initial Migrations)
1. **providers table**: Store provider configurations (without API keys)
2. **conversations table**: Store conversation metadata
3. **messages table**: Store message history
4. **models table**: Cache available models per provider

#### Backend (Rust)
- **5 Core Models**:
  - `Provider`: Provider configuration
  - `Message`: Chat message with role and content
  - `Conversation`: Chat session
  - `Model`: AI model metadata
  - `ProviderType`: OpenAI, Anthropic enum
- **5 Tauri Commands**:
  - `add_provider`: Register new provider with API key
  - `remove_provider`: Delete provider configuration
  - `list_providers`: Get all configured providers
  - `list_provider_models`: Fetch available models
  - `validate_provider_api_key`: Test API credentials

#### Frontend (React)
- **Components**:
  - `ProviderList`: Display and manage providers
  - `ProviderForm`: Add/edit provider configuration
  - `ChatInterface`: Single-model chat UI
  - `MessageList`: Display conversation history
  - `ModelSelector`: Choose model for chat
- **State Management**:
  - Jotai atoms for providers, conversations, messages
  - Reactive updates across components

#### Security Features
- OS keychain integration for secure API key storage
- API keys never stored in database (only in keychain)
- Cross-platform credential management
- Provider isolation (separate keys per provider)

### Success Criteria Met
- Can add OpenAI provider with API key
- Can add Anthropic provider with API key
- Can list available models for each provider
- Can send chat message to selected model
- Can view message history
- API keys stored securely in OS keychain

---

## Version Plan

| Version | Phase | Status | Release Date |
|---------|-------|--------|--------------|
| v0.1.0 | Phase 01-03 | ✅ Released | 2026-03-04 |
| v0.2.0 | Phase 04 | ✅ Released | 2026-03-04 |
| v0.3.0 | Phase 05 | ✅ Released | 2026-03-04 |
| v0.4.0 | Phase 06 | 📋 Planned | TBD |
| v1.0.0 | Production Ready | 📋 Planned | TBD |

---

## Links

- [Implementation Plan](../plans/260304-2008-ai-orchestrator-desktop/plan.md)
- [System Architecture](./system-architecture.md)
- [Codebase Summary](./codebase-summary.md)
- [Project Roadmap](./project-roadmap.md)

---

**Maintained By**: ClaudeKit Engineer Team
**Last Review**: 2026-03-04
**Next Review Target**: After Phase 06 completion
