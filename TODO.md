# TODO — Immediate Next Actions

## Completed (Session 2026-08-13, v0.5.0)
- [x] **MCP server** — `/api/mcp` exposes 10 CRM tools to external AI agents (JSON-RPC 2.0, MCP spec)
- [x] **Workflow engine** — conditional if/then automation (5 triggers, 5 actions)
- [x] **Workflow Builder UI** + **HyperNexus Guide UI**
- [x] Inbound communications endpoint (fires `communication_received` workflows)
- [x] Expanded NL intents (list_properties, list_tasks, get_contact)
- [x] MCP_TOKEN auth for external agents
- [x] 8 MCP tests (total 50)

## Completed (Session 2026-08-12, v0.4.0)
- [x] Expand Prisma schema (17 models) + migration
- [x] Authentication (JWT + bcrypt, login/register/logout/me)
- [x] Contact management (CRUD + search + filters + pagination + detail page)
- [x] CSV import/export
- [x] Router vault integration + tiered fallbacks
- [x] **Actual LLM execution** (OpenAI/Anthropic/Gemini/DeepSeek/Qwen)
- [x] **HyperNexus workflow engine** (NL commands → CRM actions)
- [x] **Pipeline kanban** (drag-and-drop)
- [x] **Task management** (CRUD + priorities + completion)
- [x] **Property management** (MLS CRUD + UI)
- [x] **Team management** (invites + commission + roles)
- [x] **Campaign management** (drip steps + activate/pause)
- [x] **Email verification** (token-based)
- [x] **Password reset** (forgot/reset flows)
- [x] **Social OAuth** (connect/callback for 5 platforms)
- [x] **Rate limiting** (auth, router, HyperNexus)
- [x] **PostgreSQL support** (adapter auto-select)
- [x] 42 unit tests, lint clean, build verified (30 routes)

## Next Development Actions (Priority Order)
- [ ] **Campaign scheduler** — background job to send queued campaign steps (needs SMS/email delivery providers)
- [ ] **SMS/Email delivery providers** — integrate Twilio (SMS) and Resend/SendGrid (email)
- [ ] **Local model bridge** — HTTP adapter for Hermes Agent / OpenClaw
- [ ] **MCP server** — expose CRM as MCP tools for external AI agents
- [ ] **Agentic Content Creator** — wire LLM + social OAuth into auto-post flow
- [ ] **Lead enrichment agent** — background web-scrubbing for missing contact data
- [ ] **Pipeline stage management UI** — add/remove/reorder stages in Settings
- [ ] **Advanced lead scoring** — configurable scoring rules
- [ ] **Notifications** — in-app + email notifications for task due dates
- [ ] **Full-text search** — improve contact search with PostgreSQL tsvector
- [ ] **Integration tests** — end-to-end API tests against a test database
- [ ] **CSV import validation** — sample template download, better error UI
- [ ] **Docker Compose** — PostgreSQL + app for local production-like dev

## Cleanup
- [ ] Commit all changes to `main`
- [ ] Consider deleting stale remote branches
- [ ] Add CI pipeline (lint + test + build on PR)
