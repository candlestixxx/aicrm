# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.0] - 2026-08-05
### Added
- **Phase 1: Environment & MCP Initialization:**
    - Scaffolded the foundation with Next.js 16 (App Router), TypeScript, and TailwindCSS.
- **Phase 2: Security & The Multi-Model Router:**
    - Deployed the `HyperNexus` MCP router (`src/app/api/router/route.ts`) to evaluate task complexity and route to Tier 1 or Tier 2 models.
    - Implemented a secure PostgreSQL `ApiKey` vault via Prisma ORM v7.
    - Added `src/lib/encryption.ts` using Node.js `crypto` (`aes-256-gcm`) to encrypt API keys at rest.
    - Built the `ModelManager` UI to allow users to securely toggle and input API keys for various cloud providers and local orchestrators.
    - Initiated core documentation standards (`VISION.md`, `MEMORY.md`, `DEPLOY.md`, `IDEAS.md`, `CHANGELOG.md`, `VERSION.md`, `ROADMAP.md`, `TODO.md`, `HANDOFF.md`, `AGENTS.md`).