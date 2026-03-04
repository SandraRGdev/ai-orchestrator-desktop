---
title: "AI Orchestrator Desktop Implementation"
description: "Multi-platform desktop app for AI model orchestration, comparison, and multi-agent execution"
status: in-progress
priority: P1
effort: 48h
branch: develop
tags: [tauri, rust, react, desktop, ai-orchestrator]
created: 2026-03-04
---

# AI Orchestrator Desktop Implementation Plan

**Location**: `apps/ai-orchestrator-desktop/`
**Version**: v0.1.0 (MVP)
**Reports Referenced**:
- [Brainstorm Report](../../reports/brainstorm-260304-1957-ai-orchestrator-desktop-architecture.md)
- [Tauri React Research](../../reports/researcher-260304-2007-tauri-react-integration.md)
- [Rust Security Research](../../reports/researcher-260304-2007-rust-security.md)

## Branching Strategy

```
main (protected)           <- production releases only
  ↑
develop                    <- integration branch
  ↑
feature/*                  <- feature branches
```

**Rules**:
- `main` is protected - NO direct commits
- All development happens on `feature/*` branches
- Features merge to `develop` via PR
- `develop` merges to `main` for releases
- Each release tagged with semantic version

## Semantic Versioning Plan

| Version | Phase | Description |
|---------|-------|-------------|
| v0.1.0 | Phase 1-3 | Foundation + basic chat |
| v0.2.0 | Phase 4 | Comparison mode |
| v0.3.0 | Phase 5 | Multi-agent workflows |
| v0.4.0 | Phase 6 | Polish + wizard |
| v1.0.0 | Future | Production ready |

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Tauri 2 |
| **Frontend** | React 19 + Vite |
| **State** | Jotai |
| **Database** | SQLite + sqlx (async) |
| **Security** | keyring + argon2 + secrecy |
| **Types** | ts-rs (shared) |

## Phases Overview

| Phase | Branch | Version | Status |
|-------|--------|---------|--------|
| 01. Foundation | `feature/foundation` | v0.1.0-alpha | complete |
| 02. Provider System | `feature/provider-system` | v0.1.0-beta | complete |
| 03. Single Chat | `feature/single-chat` | v0.1.0 | pending |
| 04. Comparison Mode | `feature/comparison-mode` | v0.2.0 | pending |
| 05. Multi-Agent | `feature/multi-agent` | v0.3.0 | pending |
| 06. Polish & Wizard | `feature/polish-wizard` | v0.4.0 | pending |

## Quick Links

- [Phase 01: Foundation](./phase-01-foundation.md)
- [Phase 02: Provider System](./phase-02-provider-system.md)
- [Phase 03: Single Chat](./phase-03-single-chat.md)
- [Phase 04: Comparison Mode](./phase-04-comparison-mode.md)
- [Phase 05: Multi-Agent Workflows](./phase-05-multi-agent.md)
- [Phase 06: Polish & Wizard](./phase-06-polish-wizard.md)

## Architecture Decisions

**Service-Based Commands**: Higher-level IPC operations instead of fine-grained

**Hybrid Security**: OS keychain + user password unlock

**Hybrid Agents**: Presets for ease + JSON schemas for power users

**Shared Types**: ts-rs for type-safe Rust/TypeScript boundary

## Success Metrics

- Functional: Execute 3+ models in parallel < 2s
- Security: Zero exposed secrets in memory
- UX: < 3s cold start, < 100ms UI response
- Code: < 200 lines per file

## Risks

| Risk | Mitigation |
|------|------------|
| Tauri 2 breaking changes | Pin versions, watch issues |
| ts-rs sync issues | CI check, regenerate on changes |
| SQLite concurrency | Enable WAL mode |

## Unresolved Questions

- UI component library choice (shadcn/ui, custom, other?)
- Streaming support priority for MVP?
- Cost estimation accuracy requirements?
