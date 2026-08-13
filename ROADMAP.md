# Roadmap

## Phase 1: Foundation (v0.1.x → v0.3.x) — ✅ COMPLETE
- [x] Scaffold Next.js 16 app with TypeScript and Tailwind CSS
- [x] Set up Prisma ORM
- [x] ESLint 9 + TypeScript strict mode
- [x] Multi-tenant schema (Agent, Team, Brokerage hierarchy)
- [x] Smart Contact Management with CSV import/export
- [x] Smart Filter segments (search + status filters)
- [x] MLS-compliant database schemas (Property model)
- [x] Authentication (JWT sessions + bcrypt)
- [x] Unit tests (encryption, passwords, JWT)

## Phase 2: AI Core (v0.4.x → v0.6.x)
- [x] Secure API Vault with AES encryption
- [x] `/api/vault` — API key CRUD endpoints
- [x] `/api/router` — HyperNexus tiered routing logic
- [x] Model Manager UI with provider toggles
- [x] Multi-Model Router: tiered routing integrated with vault (decrypts keys, falls back across tiers)
- [x] **Actual LLM execution** — router calls OpenAI/Anthropic/Gemini/DeepSeek/Qwen APIs
- [x] **HyperNexus workflow engine** — natural-language commands → CRM actions (rule-based + LLM fallback)
- [x] **Rate limiting** — auth, router, and HyperNexus endpoints
- [x] **Email verification + password reset** — token-based flows
- [x] **Social OAuth** — Facebook/Instagram/LinkedIn/YouTube/Google Business connect + callback APIs
- [x] **MCP server** — HyperNexus exposes 10 CRM tools as MCP (Model Context Protocol) for external AI agents
- [x] **Workflow engine** — conditional if/then automation (the "lead replies yes → Hot" example works)
- [ ] Local model support: Hermes Agent, OpenClaw connectors (UI present, needs local HTTP bridge)

## Phase 3: Marketing Engine (v0.7.x → v0.9.x)
- [x] Campaign CRUD + drip step sequencing (schema + API + UI)
- [ ] Campaign **execution scheduler** (cron/timer to send queued steps)
- [x] Social OAuth integration framework (connect/disconnect/token storage)
- [ ] Agentic Content Creator: AI research → copy → media → schedule (needs LLM + social execution wiring)
- [ ] SMS/Email delivery providers (Twilio, Resend, SendGrid integration)
- [ ] Custom text-code generation for physical property signs

## Phase 4: Real Estate Deep-Dive (v1.0.x)
- [x] Property management (MLS-compliant CRUD + UI)
- [x] Pipeline kanban view with drag-and-drop
- [x] Contact detail page (activities, communications, quick actions)
- [x] Task management with priorities & follow-ups
- [x] Team management (invites, roles, commission splits)
- [ ] Funnel & Page Builder with analytics
- [ ] Single Property Site generator
- [ ] Automated lead enrichment (background web-scrubbing agent)
- [ ] Full Lofty feature parity

## Phase 5: Voice AI (v1.1.x+)
- [ ] LEADG AI voice dialing agent integration
- [ ] WebRTC bi-directional audio streaming
- [ ] Call logging, disposition tracking, transcription storage
- [ ] Telephony state machine

## Future Horizons
- [ ] Mobile companion app
- [ ] Marketplace for MCP workflow templates
- [ ] White-label reseller mode
- [ ] Enterprise SSO / SAML
- [ ] PostgreSQL production deployment (adapter ready, needs hosted DB + `prisma migrate deploy`)
- [ ] Redis-based rate limiting for multi-instance deployments
