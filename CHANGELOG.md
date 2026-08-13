# Changelog

All notable changes to the AiCRM project will be documented in this file.

## [0.7.0] — 2026-08-13

### Added (HyperNexus Control Plane — full surface)
- **Tool catalog proxying** — `/api/hypernexus/tools` (search + call + catalog list), `src/lib/hypernexus/tools.ts`, and `ToolCatalog.tsx` UI. Exposes HyperNexus's 26,000+ MCP tool catalog to AiCRM.
- **Swarm orchestration** — `/api/hypernexus/swarm` (start/debate/consensus/missions), `src/lib/hypernexus/swarm.ts`, and `SwarmConsole.tsx` UI.
- **Dashboard embed** — `HyperNexusDashboard.tsx` iframe embed of the HyperNexus `apps/web` dashboard with kernel status + graceful fallback.
- **2 new MCP tools** — `hypernexus_search_tools` and `hypernexus_swarm` added to AiCRM's MCP server (12 tools total).
- **HyperNexus tab split** — "Assistant & Workflows" vs "Control Plane" sub-views.

### Verified
- Tool search proxy → HyperNexus kernel ✓
- Swarm start → returns missionId (`mission-...`, status started) ✓
- MCP tools/list → 12 tools including new HyperNexus tools ✓

### Note
- Full tool catalog + real swarm LLM calls require the HyperNexus TypeScript backend (`pnpm install` + `pnpm dev` in the submodule) and AI provider keys. The Go kernel provides local fallbacks.

## [0.6.0] — 2026-08-13

### Added (Real HyperNexus Control Plane Integration)
- **HyperNexus as a git submodule** in the `workspace` repo (`github.com/HyperNexusllc/HyperNexus`)
- **Built & verified the HyperNexus Go kernel** (`bin/tormentnexus.exe`, `serve` on :7778, `mcp`, `version`)
- **pi extension** (`~/.pi/agent/extensions/hypernexus.ts`) — 4 tools (memory add/search, status, chat) + `/hypernexus` command
- **AiCRM client** (`src/lib/hypernexus/client.ts`) — health, memory add/search, agent chat
- **AiCRM bridge endpoints** — `/api/hypernexus/kernel` (status), `/api/hypernexus/kernel/memory` (add/search), `/api/hypernexus/kernel/chat`
- **Workflow memory mirroring** — workflow executions are persisted into HyperNexus episodic memory
- **Kernel status badge** in the HyperNexus guide UI
- **`INTEGRATION.md`** — full architecture, setup, and scope documentation
- **`HYPERNEXUS_URL`** env var (defaults to `http://127.0.0.1:7778`)

### Changed
- Version bumped to 0.6.0

## [0.5.0] — 2026-08-13

### Added (HyperNexus as the Heart)
- **MCP Server** (`src/lib/mcp/server.ts` + `/api/mcp`) — full Model Context Protocol (JSON-RPC 2.0) endpoint exposing 10 CRM tools to external AI agents (list_contacts, get_contact, create_contact, update_lead_stage, list_properties, create_task, list_tasks, summarize_brokerage, search_contacts, log_activity). Auth via session cookie or `Authorization: Bearer <MCP_TOKEN>`.
- **Workflow Engine** (`src/lib/hypernexus/workflows.ts`) — conditional "if/then" automation with 5 trigger events (communication_received, lead_created, lead_updated, contact_created, task_completed), condition evaluation (contains/equals/not_contains/exists), and 5 action types (update_lead_stage, create_task, add_activity, create_communication, notify).
- **Workflow model** — new Prisma model with triggerEvent, triggerCondition (JSON), actions (JSON), runCount, lastRunAt.
- **Workflow API** — `/api/hypernexus/workflows` (CRUD) + `[id]` (patch/delete) + test endpoint.
- **Workflow Builder UI** (`src/components/WorkflowBuilder.tsx`) — visual builder with trigger/condition/action pickers.
- **HyperNexus Guide UI** (`src/components/HyperNexusGuide.tsx`) — in-app documentation with MCP endpoint details and external links.
- **Inbound communications endpoint** (`/api/communications`) — records lead replies and fires `communication_received` workflows.
- **Workflow triggers wired** into lead updates, contact creation, and communication receipt.
- **Expanded NL intents** — list_properties, list_tasks, get_contact.
- **8 new MCP server tests** — total 50 tests.
- **MCP_TOKEN** env var for external agent auth.

### Changed
- HyperNexus dashboard tab now shows guide + console + workflow builder
- `/api/mcp` allowed through proxy (self-authenticates)

## [0.4.0] — 2026-08-12

### Added (Full Feature Suite)
- **LLM Provider Clients** (`src/lib/llm/providers.ts`) — real API execution for OpenAI, Anthropic, Gemini, DeepSeek, Qwen, Xiaomi (OpenAI-compatible). Router now executes actual model calls with usage tracking and latency reporting.
- **HyperNexus Workflow Engine** (`src/lib/hypernexus/engine.ts`) — natural-language command → CRM action with rule-based intent detection + LLM fallback. Supports: update lead stage, create task, list contacts, summarize brokerage, send communication.
- **HyperNexus Console UI** (`src/components/HyperNexusConsole.tsx`) — terminal-style NL command interface with example commands.
- **Pipeline Kanban Board** (`src/components/PipelineBoard.tsx`) — drag-and-drop lead stages with budget/timeline display.
- **Task Management** — full CRUD API (`/api/tasks`) + UI with priorities, types, due dates, completion tracking.
- **Property Management** — MLS-compliant CRUD API (`/api/properties`) + card-based UI with listing details.
- **Team Management** — agent/team APIs (`/api/team`) + invite flow (`/api/team/invite`) with email delivery + commission split editing.
- **Campaign Management** — drip campaign CRUD API (`/api/campaigns`) + UI with step sequencing and activate/pause.
- **Contact Detail Page** (`/contacts/[id]`) — full profile with activities timeline, communications, quick status actions, inline editing.
- **Email Verification** — token-based verification API with resend flow.
- **Password Reset** — forgot-password + reset-password API + pages with rate limiting.
- **Social OAuth** (`src/lib/social/oauth.ts`) — Facebook, Instagram, LinkedIn, YouTube, Google Business config + connect/callback APIs with encrypted token storage.
- **Rate Limiting** (`src/lib/rate-limit.ts`) — in-memory limiter applied to auth, router, and HyperNexus endpoints.
- **Mailer Abstraction** (`src/lib/mailer.ts`) — console (dev) + provider placeholders (SMTP, Resend, SendGrid).
- **PostgreSQL Support** — DB adapter auto-selects libsql (SQLite) vs pg (PostgreSQL) based on `DATABASE_URL`.
- **24 additional unit tests** — rate limiting (5), HyperNexus intent detection (11), LLM provider factory (8). Total: 42 tests.

### Changed
- Dashboard expanded to 10 tabs: Dashboard, HyperNexus, Contacts, Pipeline, Tasks, Properties, Campaigns, Team, AI Models, Settings
- Contact names now link to detail pages; proper "Add Contact" modal
- TypeScript target bumped to ES2020 (for regex named capture groups)
- `@prisma/adapter-pg` and `pg` moved to production dependencies

## [0.3.0] — 2026-08-12

### Added (Multi-Tenant Foundation + Auth + Contact Management)
- Expanded Prisma schema — 17 models covering multi-tenant hierarchy, contacts & leads, pipelines, properties, activities & tasks, marketing, social OAuth, and auth
- Authentication system — JWT sessions with bcrypt, login/register/logout/me routes, protected routes via proxy
- Login & Registration pages with brokerage onboarding
- Smart Contact Management — full CRUD API, search + status filtering, pagination, activity logging
- Lead management via `/api/leads/[id]`
- CSV import/export with header mapping & error reporting
- HyperNexus Router vault integration with tiered fallbacks
- Dashboard UI with sidebar navigation
- Seed script, `.env.example`, 18 unit tests

### Fixed
- Prisma 7 driver adapter requirement (libsql)
- `middleware.ts` → `proxy.ts` (Next.js 16 convention)
- Cost display bug in router
- React Compiler lint errors

## [0.2.1] — 2026-08-05

### Repository
- Sync verification: all branches reconciled
- Documentation refreshed

## [0.2.0] — 2026-08-05

### Added (Next.js Scaffold)
- Next.js 16 + TypeScript 5 + Tailwind CSS 4 scaffold
- Prisma ORM schema, encryption lib, API vault + router routes
- Model Manager UI, architectural docs

## [0.1.0] — 2026-08-05

### Added
- Initial project vision (README.md): HyperNexus MCP orchestration, multi-model routing, real estate CRM scope
- Foundation documentation
