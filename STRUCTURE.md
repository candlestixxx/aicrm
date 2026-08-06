# Project Structure Map

> Last updated: 2026-08-05 | Version: 0.2.0

## Repository
| Property | Value |
|----------|-------|
| **Remote URL** | `https://github.com/candlestixxx/aicrm.git` |
| **Default Branch** | `main` |
| **Upstream Fork** | None (standalone origin) |
| **Framework** | Next.js 16 + TypeScript 5 + Tailwind CSS 4 |

## Branch Inventory
| Branch | HEAD Commit | Status |
|--------|-------------|--------|
| `main` | `75e835c` (merge) | **Active** — v0.2.0 with Next.js scaffold |
| `jules-3434254056450392757-d9850c0f` | `75e835c` (fast-forward) | **Synced** — caught up with main; Next.js scaffold author branch |

## Submodules
- **None** — No git submodules configured.

## File Layout (v0.2.0)
```
aicrm/
├── .gitignore                    # Combined Node.js/Next.js/Yarn/Prisma hygiene
├── AGENTS.md                     # AI/MCP architectural rules
├── CHANGELOG.md                  # Release history
├── CLAUDE.md                     # Claude-specific coding conventions
├── HANDOFF.md                    # Session handoff log
├── README.md                     # Project vision & architecture
├── ROADMAP.md                    # Phased development plan
├── STRUCTURE.md                  # This file — structural map
├── TODO.md                       # Immediate action items
├── VERSION                       # Semantic version (0.2.0)
├── eslint.config.mjs             # ESLint 9 config
├── next-env.d.ts                 # Next.js TypeScript declarations (auto-generated)
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies & scripts (next, react 19, prisma, tailwind)
├── package-lock.json
├── postcss.config.mjs            # PostCSS/Tailwind config
├── prisma.config.ts              # Prisma client config
├── prisma/
│   └── schema.prisma             # Database schema (PostgreSQL adapter)
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css           # Tailwind global styles
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── api/
│   │       ├── router/
│   │       │   └── route.ts      # HyperNexus tiered routing API
│   │       └── vault/
│   │           └── route.ts      # Secure API key vault CRUD
│   ├── components/
│   │   └── ModelManager.tsx      # Provider toggle UI (Lucide icons)
│   └── lib/
│       ├── db/
│       │   └── prisma.ts         # Prisma client singleton
│       └── encryption.ts         # AES symmetric encryption for API keys
├── tsconfig.json                 # TypeScript config
└── .next/                        # Build output (auto-generated)
```

## Architecture Notes
- **Framework:** Next.js 16 App Router with React 19
- **Styling:** Tailwind CSS 4 with PostCSS
- **Database:** Prisma ORM v7.9 with PostgreSQL adapter
- **API Routes:** `/api/vault` (key CRUD), `/api/router` (tiered AI routing)
- **Encryption:** Node.js `crypto` module with AES-256-GCM
- **Linting:** ESLint 9 with `eslint-config-next`
