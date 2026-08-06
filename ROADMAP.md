# Roadmap

## Phase 1: Foundation (v0.1.x → v0.3.x)
- [x] Scaffold Next.js 16 app with TypeScript and Tailwind CSS
- [x] Set up Prisma ORM with PostgreSQL adapter (`prisma/schema.prisma`)
- [x] ESLint 9 + TypeScript strict mode configured
- [ ] Implement multi-tenant schema (Agent, Team, Brokerage hierarchy)
- [ ] Build Smart Contact Management with CSV import/export
- [ ] Smart Filter segments for dynamic lead lists
- [ ] MLS-compliant database schemas

## Phase 2: AI Core (v0.4.x → v0.6.x)
- [x] Secure API Vault with AES symmetric encryption for provider keys (`src/lib/encryption.ts`)
- [x] `/api/vault/route.ts` — API key CRUD endpoints
- [x] `/api/router/route.ts` — HyperNexus tiered routing logic
- [x] Model Manager UI with provider toggles (`src/components/ModelManager.tsx`)
- [ ] Multi-Model Router: tiered routing (fast/cheap → complex/expensive) — logic in place, needs integration
- [ ] HyperNexus natural-language workflow engine (MCP-based)
- [ ] Local model support: Hermes Agent, OpenClaw connectors
- [ ] Connect frontend UI to API routes

## Phase 3: Marketing Engine (v0.7.x → v0.9.x)
- [ ] Social Studio: OAuth integrations (Facebook, Instagram, LinkedIn, YouTube, Google Business)
- [ ] Agentic Content Creator: AI research → copy → media → schedule
- [ ] Omnichannel drip campaigns (SMS + Email)
- [ ] Custom text-code generation for physical property signs

## Phase 4: Real Estate Deep-Dive (v1.0.x)
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
