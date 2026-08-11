# Changelog

All notable changes to the AiCRM project will be documented in this file.

## [0.2.1] — 2026-08-05

### Repository
- Sync verification: all branches reconciled (jules already merged)
- Working tree clean, build verified
- Documentation refreshed (ROADMAP, TODO, STRUCTURE, HANDOFF)

## [0.2.0] — 2026-08-05

### Added (Next.js Scaffold — merged from jules branch)
- Next.js 16 app scaffold with TypeScript 5 and Tailwind CSS 4
- ESLint 9 configuration (`eslint.config.mjs`)
- Prisma ORM schema with PostgreSQL adapter (`prisma/schema.prisma`)
- `src/lib/encryption.ts` — AES symmetric encryption for API key vault
- `src/lib/db/prisma.ts` — Prisma client singleton
- `src/app/api/vault/route.ts` — Secure API key storage CRUD endpoints
- `src/app/api/router/route.ts` — HyperNexus tiered routing logic
- `src/components/ModelManager.tsx` — Provider toggle UI with Lucide icons
- `AGENTS.md` — Architectural rules for AI/MCP agents
- `CLAUDE.md` — Claude-specific coding conventions
- Prisma config (`prisma.config.ts`)

### Fixed
- `.gitignore` conflict resolved — combined main + jules versions

### Changed
- Version bumped to 0.2.0

## [0.1.0] — 2026-08-05

### Added
- Initial project vision and architecture document (`README.md`)
- Platform concept: HyperNexus natural-language workflow orchestration via MCP
- Multi-Model Router & Tiered Routing Architecture design
- Core Real Estate feature scope (Lofty parity)
- Social Studio & Marketing Engine design
- Phase 2 LEADG voice dialing agent architecture pre-planning
- Foundation documentation: VERSION, CHANGELOG, ROADMAP, TODO, STRUCTURE, HANDOFF, .gitignore

### Repository
- `main` branch: v0.1.0 baseline
- `jules-3434254056450392757-d9850c0f`: phantom commit (later updated with real scaffold)
