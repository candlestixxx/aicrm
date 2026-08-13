# Project Structure Map

> Last updated: 2026-08-12 | Version: 0.4.0

## Repository
| Property | Value |
|----------|-------|
| **Remote URL** | `https://github.com/candlestixxx/aicrm.git` |
| **Default Branch** | `main` |
| **Upstream Fork** | None (standalone origin) |
| **Framework** | Next.js 16 + TypeScript 5 + Tailwind CSS 4 |
| **Dev URL** | `http://localhost:3001` (port 3000 is reserved for the original CRM) |

## Branch Inventory
| Branch | HEAD Commit | Status |
|--------|-------------|--------|
| `main` | `75e835c` (merge) | **Active** — v0.4.0 full feature suite |

## Submodules
- **None**

## File Layout (v0.4.0)
```
aicrm/
├── .env / .env.example          # Env config (DB, secrets, email, OAuth)
├── .gitignore                   # Node/Next/Prisma hygiene
├── AGENTS.md / CLAUDE.md        # AI/MCP architectural rules
├── CHANGELOG.md / README.md     # History + vision
├── ROADMAP.md / TODO.md         # Plan + action items
├── STRUCTURE.md / HANDOFF.md    # This file + session log
├── VERSION                      # 0.4.0
├── package.json                 # Deps + scripts (db:, test, lint)
├── vitest.config.mts            # Vitest config
├── prisma/
│   ├── schema.prisma            # 17-model multi-tenant schema
│   ├── seed.ts                  # Demo data seeder
│   └── migrations/              # SQL migrations
├── src/
│   ├── proxy.ts                 # Auth route protection (Next.js 16 proxy)
│   ├── app/
│   │   ├── page.tsx             # Dashboard (10 tabs)
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── contacts/[id]/page.tsx   # Contact detail
│   │   └── api/
│   │       ├── auth/            # login, register, logout, me, verify-email, forgot/reset-password
│   │       ├── contacts/        # CRUD + import + export
│   │       ├── leads/[id]/      # Lead status/stage updates
│   │       ├── tasks/           # CRUD + [id]
│   │       ├── properties/      # CRUD + [id]
│   │       ├── team/            # List/create + [id] + invite
│   │       ├── pipelines/       # List/create + board (kanban)
│   │       ├── campaigns/       # CRUD + [id]
│   │       ├── hypernexus/      # NL command execution
│   │       ├── social/          # List/connect/callback
│   │       ├── router/          # HyperNexus tiered routing + LLM execution
│   │       └── vault/           # API key CRUD (encrypted)
│   ├── components/
│   │   ├── ContactList.tsx      # Contacts CRUD + filters + CSV
│   │   ├── PipelineBoard.tsx    # Kanban drag-and-drop
│   │   ├── TaskManager.tsx      # Task CRUD + priorities
│   │   ├── PropertyManager.tsx  # MLS listing cards
│   │   ├── TeamManager.tsx      # Agents + invites + commission
│   │   ├── CampaignManager.tsx  # Drip campaigns
│   │   ├── HyperNexusConsole.tsx # NL command terminal
│   │   └── ModelManager.tsx     # AI provider connections
│   └── lib/
│       ├── auth/                # jwt.ts, password.ts + tests
│       ├── db/prisma.ts         # Prisma client (libsql/pg auto-select)
│       ├── encryption.ts        # AES-256-GCM + test
│       ├── rate-limit.ts        # In-memory rate limiter + test
│       ├── mailer.ts            # Email abstraction
│       ├── llm/providers.ts     # OpenAI/Anthropic/Gemini/DeepSeek/Qwen + test
│       ├── hypernexus/engine.ts # NL command engine + test
│       └── social/oauth.ts      # OAuth providers config
└── .next/                       # Build output
```

## Architecture Notes
- **Framework:** Next.js 16 App Router + React 19 + SWR for client data
- **Database:** Prisma 7 + libsql (SQLite dev) / pg (PostgreSQL prod), auto-selected by `DATABASE_URL`
- **Auth:** Custom JWT (jose) + bcrypt, proxy-based route protection, rate-limited
- **AI:** HyperNexus router (tiered routing + real LLM execution) + NL workflow engine
- **Email:** Console in dev, provider pluggable (SMTP/Resend/SendGrid)
- **Social:** OAuth framework for 5 platforms with encrypted token storage
- **Testing:** Vitest — 42 tests (encryption, password, JWT, rate-limit, HyperNexus intents, LLM factory)

## Database Schema (17 models)
| Model | Purpose |
|-------|---------|
| User, Account, Session, VerificationToken | Authentication + invites/resets |
| Brokerage, Team, Agent | Multi-tenant hierarchy |
| Contact, Lead | Contacts & leads |
| Pipeline, PipelineStage | Sales pipeline |
| Property, PropertyImage | MLS listings |
| Task, Activity, Communication | Activity tracking |
| Campaign, CampaignStep | Drip campaigns |
| SocialAccount | Social OAuth tokens |
| ApiKey | Encrypted AI provider keys |

## API Surface (30 routes)
- Auth: `/api/auth/login|register|logout|me|verify-email|forgot-password|reset-password`
- CRM: `/api/contacts`, `/api/contacts/[id]`, `/api/contacts/import|export`, `/api/leads/[id]`
- Ops: `/api/tasks`, `/api/tasks/[id]`, `/api/properties`, `/api/properties/[id]`
- Team: `/api/team`, `/api/team/[id]`, `/api/team/invite`
- Pipeline: `/api/pipelines`, `/api/pipelines/board`
- Marketing: `/api/campaigns`, `/api/campaigns/[id]`
- AI: `/api/router`, `/api/hypernexus`, `/api/vault`
- Social: `/api/social`, `/api/social/connect`, `/api/social/callback/[platform]`
