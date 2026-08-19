# Changelog

All notable changes to the AiCRM project will be documented in this file.

## [0.13.0] — 2026-08-18

### Added (Light/Dark theme + color palettes)
- **Theme system** — full light/dark mode with a `system` option, persisted to localStorage and applied before first paint (no flash of wrong theme).
- **6 accent palettes** — Ocean, Violet, Teal, Rose, Amber, and Slate; the brand accent (`blue-*` scale) is remapped to the selected palette app-wide.
- **Per-palette dark variants** — each palette has tuned dark-mode shades (brighter ink for contrast + dark-tinted soft backgrounds) so chips, links, and buttons look right on dark surfaces.
- **ThemeSwitcher UI** — dropdown in the dashboard header (mode toggle + palette swatches) and a floating switcher on the auth pages.
- **Live preview + Apply/Cancel** — selecting a mode or palette previews it on the page without saving; Apply commits it, Cancel (or closing) reverts to the saved theme.
- **Theme-aware utilities** — Tailwind's gray scale and `bg-white` surfaces are remapped to CSS variables, so existing components flip light/dark automatically.
- **`useSyncExternalStore` provider** (`ThemeProvider.tsx`) — server-safe, hydration-mismatch-free theme state.

### Fixed
- **HyperNexus console input** — text was invisible when the OS/browser used dark mode; the input now has explicit theme-aware background, text, and placeholder colors.
- Code blocks / terminals now use explicit zinc colors so they stay readable in both themes.
- Accent headings (`text-purple-900`, `text-blue-900`) brightened for dark-mode contrast.

## [0.12.0] — 2026-08-17

### Added (User Guide + Demo, UI polish)
- **User Guide & Demo tab** (`UserGuide.tsx`) — interactive guide covering all 4 modules (HyperNexus commands, AI Assistant, Workflows, Control Plane) with step-by-step instructions and a **live demonstration button** per section.
- **Console readability** — HyperNexus command console text brightened (white/cyan/emerald on black) for visibility.
- Guide tab added first in the sidebar for discoverability.

## [0.11.0] — 2026-08-17

### Added (Pluggable AI Engine — two brains, one interface)
- **`src/lib/ai/engine.ts`** — unified `AIEngine` interface with three selectable implementations:
  - **Native (v1)** — direct calls to vault keys (DeepSeek/Gemini/OpenAI/Anthropic). Default.
  - **ControlPlane (v2)** — routes through the external HyperNexus control plane (agent chat + swarm).
  - **Hybrid (v1+v2)** — native first, control-plane fallback.
- **`/api/ai/engines`** — engine registry (lists all + active).
- **`EngineSelector.tsx`** — Settings UI showing both brains, capabilities, and active engine.
- **`AI_ENGINE` env var** — `native|controlplane|hybrid` (default native).
- Refactored workflows, NL engine, and assistant to use the unified engine (removed duplicated `callLLM` helpers).

### Design intent
This formalizes Option B (built-in brain as default) with a clean, gradual upgrade path to the external HyperNexus control plane — flip one env var when ready.

## [0.10.0] — 2026-08-17

### Added (AI Assistant Suite + Delivery)
- **AI Assistant tab** (`AssistantPanel.tsx` + `/api/assistant`) — proactive intelligence layer:
  - 📅 Daily digest (stats + headline + at-risk + nudges)
  - ⚡ Next-best-action recommendations (AI-prioritized)
  - 🔔 Smart nudges (overdue contact reminders)
  - 💔 Lead going-cold detector
  - 🔗 Lead ↔ property matching
  - 📄 CMA generator (AI Comparative Market Analysis)
  - 🔍 AI lead enrichment
- **Delivery transport** (`src/lib/delivery.ts`) — SMS (Twilio) + email (Resend) with console fallback for dev. Workflows now actually deliver messages when a provider is configured.
- **`/api/assistant`** — unified endpoint (digest, next-best, nudges, health, match, cma, enrich).

### Verified
- Daily digest returns real stats + at-risk leads + nudges ✅
- Next-best-action prioritizes hot leads ✅

### Note
- SMS/email actually send when TWILIO_* / RESEND_API_KEY env vars are set; otherwise they log to console (dev fallback).

## [0.9.0] — 2026-08-17

### Added (Supercharged Vault + Multi-step Workflows)
- **Secure Vault** (`src/components/Vault.tsx` + `/api/secrets`) — encrypted storage organized into 5 sections: API Keys, OAuth Tokens, Passwords, Notes, Other. AES-256-GCM encrypted; values never returned in lists (only via authenticated reveal endpoint).
- **Secret model** — new Prisma model (category, label, encrypted value, metadata) with brokerage scoping.
- **Multi-step workflow builder** — workflows now support chains of actions (trigger → condition → step 1 → step 2 → step 3…), with add/remove step UI.
- **Google Gemini key wired** — stored in vault, router updated to `gemini-3.6-flash` (the current model).
- **Vault tab** in the dashboard sidebar.

### Verified
- Vault: create/list (masked)/reveal (decrypted) all working ✅
- Multi-step workflow: 3-action chain stored and executes in order ✅

## [0.8.0] — 2026-08-17

### Added (AI-Powered with DeepSeek)
- **DeepSeek key wired** — stored in the encrypted vault, router now makes real LLM calls (verified: drafted a follow-up email)
- **3 AI workflow actions** — `ai_draft` (generate email/SMS), `ai_analyze` (analyze events), `negotiation_advisor` (expert negotiation advice)
- **2 new NL commands** — `negotiate/advise` and `draft/write` in the HyperNexus console
- **Workflow Builder UI** — new AI action options with purpose + custom prompt fields
- **callLLM helper** — shared vault-key lookup (prefers DeepSeek) in both workflow engine and NL engine

### Verified end-to-end
- Lead replies "yes" → workflow → DeepSeek drafts a professional follow-up email → stored in CRM ✅
- "advise should I counter at $450k or $460k" → returns expert negotiation strategy ✅

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
