# HyperNexus Integration Guide

> How the real [HyperNexus](https://github.com/HyperNexusllc/HyperNexus) control
> plane is wired into **pi** and **AiCRM**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  HyperNexus Control Plane (Go)                              │
│  TN Kernel — http://127.0.0.1:7778                          │
│  • 26,000+ MCP tools catalog                                │
│  • Tiered persistent memory (L1→L4)                         │
│  • Provider routing (38+ AI clients)                        │
│  • Agent swarm / pair / director orchestration              │
└───────────────▲──────────────────────────▲─────────────────┘
                │                          │
        ┌───────┴────────┐         ┌───────┴────────┐
        │  pi extension   │         │  AiCRM         │
        │  hypernexus.ts  │         │  /api/...      │
        └────────────────┘         └────────────────┘
```

## Submodule

HyperNexus is added as a git submodule of the `workspace` repo:

```
workspace/
├── HyperNexus/          ← git submodule (github.com/HyperNexusllc/HyperNexus)
├── aicrm/               ← this project
└── ...
```

### Build & run the kernel

```bash
cd workspace/HyperNexus/go
go build -o ../bin/tormentnexus.exe ./cmd/tormentnexus
cd ..
./bin/tormentnexus.exe serve        # kernel on http://127.0.0.1:7778
```

- `serve` — control plane (HTTP API + dashboard on :7779 via apps/web)
- `mcp`   — MCP stdio server (spawns the kernel automatically)
- `version` — prints version

Verify:
```bash
curl http://127.0.0.1:7778/health
# {"ok":true,"service":"tormentnexus-go","version":"1.0.0-b1",...}
```

## pi Integration

**File:** `~/.pi/agent/extensions/hypernexus.ts`

Registers four tools + one command in pi:

| Tool / Command | Purpose |
|----------------|---------|
| `hypernexus_memory_add` | Store persistent memory in HyperNexus |
| `hypernexus_memory_search` | Search HyperNexus memory |
| `hypernexus_status` | Check kernel health/version |
| `hypernexus_chat` | Route a prompt through HyperNexus's provider router |
| `/hypernexus` | Show integration status |

**Configure:** set `HYPERNEXUS_URL` env var to override the default
`http://127.0.0.1:7778`.

**Reload** pi after installing: `/reload`

## AiCRM Integration

**Files:**
- `src/lib/hypernexus/client.ts` — HTTP client (health, memory add/search, chat)
- `src/app/api/hypernexus/kernel/route.ts` — bridge endpoints
- `src/components/HyperNexusGuide.tsx` — live kernel status badge
- `src/lib/hypernexus/workflows.ts` — mirrors workflow executions into HyperNexus memory

**Endpoints:**
| Endpoint | Purpose |
|----------|---------|
| `GET /api/hypernexus/kernel` | Kernel status |
| `POST /api/hypernexus/kernel/memory` | Add memory |
| `GET /api/hypernexus/kernel/memory?query=` | Search memory |
| `POST /api/hypernexus/kernel/chat` | Route a prompt |
| `GET /api/hypernexus/tools?query=` | Search the MCP tool catalog |
| `POST /api/hypernexus/tools` | Call a catalog tool |
| `GET /api/hypernexus/swarm` | List swarm missions |
| `POST /api/hypernexus/swarm?action=start\|debate\|consensus` | Run swarm ops |

**Config:** `HYPERNEXUS_URL` in `.env` (defaults to `http://127.0.0.1:7778`).

**Behavior:** when AiCRM workflows fire, the execution is mirrored into
HyperNexus episodic memory (best-effort — offline is silently tolerated).

## Scope & honesty

HyperNexus is a **large standalone product** (Go control plane + TypeScript
dashboard, 26,000+ MCP tools, tiered memory, provider routing, multi-agent
orchestration). This integration connects pi and AiCRM to its **full kernel
surface**: memory, tool catalog, swarm orchestration, and the dashboard.

**Wired now:**
- ✅ Kernel API + memory
- ✅ Tool catalog proxying (`/api/hypernexus/tools` + MCP `hypernexus_search_tools`)
- ✅ Swarm orchestration (`/api/hypernexus/swarm` + MCP `hypernexus_swarm`)
- ✅ Dashboard embed (iframe of `apps/web` on :7779)

**Requires the TypeScript backend + LLM keys** (not the Go kernel alone):
- The full 26,000+ tool catalog data (Go kernel returns an empty local inventory)
- Real multi-agent swarm LLM calls (Go kernel returns a local mission ID)

**Not yet wired:**
- Deep-link / `tormentnexus://` protocol handling
- Agent pair / director / supervisor orchestration from AiCRM
- tRPC streaming (websocket) into the dashboard embed

### Run the full backend

```bash
cd workspace/HyperNexus
pnpm install
pnpm dev            # TypeScript core (catalog + swarm with LLM)
pnpm dev:web        # dashboard on :7779
```
The Go kernel (`./bin/tormentnexus.exe serve`) still provides memory, health,
and local fallbacks independently.

## External references

- Repo: https://github.com/HyperNexusllc/HyperNexus
- MCP standard: https://modelcontextprotocol.io
