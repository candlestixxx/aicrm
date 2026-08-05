# Project Structure Map

> Last updated: 2026-08-05 | Version: 0.1.0

## Repository
| Property | Value |
|----------|-------|
| **Remote URL** | `https://github.com/candlestixxx/aicrm.git` |
| **Default Branch** | `main` |
| **Upstream Fork** | None (standalone origin) |

## Branch Inventory
| Branch | HEAD Commit | Status |
|--------|-------------|--------|
| `main` | `75e8f36` | Active — baseline |
| `jules-3434254056450392757-d9850c0f` | `d7acd63` | **Redundant** (phantom commit — no file changes; AI-generated empty scaffold) |

## Submodules
- **None** — No git submodules configured.

## File Layout (v0.1.0)
```
aicrm/
├── .gitignore          # Node.js/Next.js hygiene
├── README.md            # Project vision & architecture
├── VERSION              # Semantic version (0.1.0)
├── CHANGELOG.md         # Release history
├── ROADMAP.md           # Phased development plan
├── TODO.md              # Immediate action items
├── STRUCTURE.md         # This file — structural map
└── HANDOFF.md           # Session handoff log
```

## Planned Directory Structure (Phase 1+)
```
aicrm/
├── prisma/
│   └── schema.prisma    # Multi-tenant database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── vault/
│   │   │   │   └── route.ts    # API key vault CRUD
│   │   │   └── router/
│   │   │       └── route.ts    # HyperNexus tiered routing
│   │   └── layout.tsx
│   ├── components/
│   │   └── ModelManager.tsx    # Provider toggle UI
│   └── lib/
│       └── encryption.ts       # AES symmetric encryption
├── public/
├── AGENTS.md                    # AI architectural rules
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
