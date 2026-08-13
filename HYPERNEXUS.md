# HyperNexus User Guide

> The AI orchestration engine at the heart of AiCRM.
> Version 0.5.0 · Last updated 2026-08-13

HyperNexus lets you control your CRM three ways:

1. **Commands** — type plain English, it happens
2. **Workflows** — "if this, then that" automation that runs itself
3. **MCP** — connect external AI agents (Claude Desktop, Cursor, custom agents) to your CRM as tools

---

## 1. Commands (Natural Language)

Open the **HyperNexus** tab in the sidebar and type a command into the console.

### Supported commands

| Command | What it does |
|---------|--------------|
| `summarize my brokerage` | Shows contact, lead, property, and task counts |
| `list contacts` | Lists recent contacts |
| `list properties` | Lists your MLS listings |
| `list tasks` | Lists tasks (pending count included) |
| `get contact [id]` | Full profile for one contact |
| `create a task to [do X]` | Creates a follow-up task |
| `create a task to call John tomorrow` | Creates a task with a due date |
| `update lead [name/id] to hot` | Changes a lead's status |
| `mark lead [name] as closed won` | Alternative status phrasing |
| `send email to [name] saying [message]` | Queues a communication |
| `send sms to [name] saying [message]` | Queues an SMS |

### Status values
`new` · `active` · `hot` · `cold` · `closed_won` · `closed_lost`

### Examples
```
> summarize my brokerage
Your brokerage has 5 contacts, 5 leads (1 hot), 3 properties, 0 pending tasks.

> create a task to call John about the offer
Task "call John about the offer" created

> update lead john to hot
Lead "john" updated to "hot"
```

**Tip:** Unrecognized commands are passed to your connected AI models (if you've added API keys in *AI Models*) for interpretation.

---

## 2. Workflows (If/Then Automation)

Workflows run automatically when a CRM event happens. Build them in the **HyperNexus** tab → **Automation Workflows**.

### Triggers (WHEN)

| Trigger | Fires when |
|---------|-----------|
| `Communication Received` | A lead/contact replies via SMS or email |
| `Lead Created` | A new lead is added |
| `Lead Updated` | A lead's status or stage changes |
| `Contact Created` | Any contact is added |
| `Task Completed` | A task is marked complete |

### Conditions (filter — optional)

| Operator | Meaning |
|----------|---------|
| `contains` | Field contains a value |
| `equals` | Field equals a value |
| `not_contains` | Field does not contain a value |
| `exists` | Field has any value |

### Actions (THEN)

| Action | What it does |
|--------|--------------|
| Update lead stage | Sets a lead to hot/active/cold/won/lost |
| Create task | Adds a follow-up task |
| Log activity | Adds a note to the contact timeline |
| Send communication | Queues an email/SMS |
| Notify | Sends an email notification |

### Example workflow

**Goal:** when a lead replies "yes", mark them Hot.

| Field | Value |
|-------|-------|
| Trigger | Communication Received |
| Condition | `body` `contains` `"yes"` |
| Action | Update lead stage → `hot` |

### Common recipes

| Recipe | Trigger | Condition | Action |
|--------|---------|-----------|--------|
| Hot lead on reply | Communication Received | body contains "yes" | Update stage → hot |
| Welcome every new lead | Lead Created | *(none)* | Notify broker |
| Follow up cold leads | Lead Updated | status equals "cold" | Create task "Re-engage lead" |
| Log every new contact | Contact Created | *(none)* | Log activity "New contact added" |

---

## 3. MCP — Connect External AI Agents

HyperNexus speaks the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), the open standard (by Anthropic) for connecting AI assistants to tools and data.

Any MCP-compatible client can use your CRM as a set of tools.

### Endpoint

```
POST http://localhost:3001/api/mcp
```

### Authentication

```
Authorization: Bearer <MCP_TOKEN>
```

Set `MCP_TOKEN` in your `.env` file:
```env
MCP_TOKEN="your-secret-token"
```
Generate one with: `openssl rand -hex 32`

### Exposed tools

| Tool | Parameters |
|------|-----------|
| `list_contacts` | `search`, `status`, `limit` |
| `get_contact` | `id` |
| `create_contact` | `firstName`, `lastName`, `email`, `phone`, `city`, `state`, `source`, `isLead` |
| `update_lead_stage` | `leadId`, `status`, `stageId` |
| `list_properties` | `status`, `city`, `limit` |
| `create_task` | `title`, `description`, `dueDate`, `priority`, `contactId` |
| `list_tasks` | `status` |
| `summarize_brokerage` | *(none)* |
| `search_contacts` | `query` |
| `log_activity` | `contactId`, `type`, `description` |

### Example MCP call (JSON-RPC 2.0)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_brokerage",
    "arguments": {}
  }
}
```

---

## 4. Claude Desktop Setup

Claude Desktop can connect directly to your CRM's MCP endpoint.

### Step 1 — Generate a token

In your project `.env`:
```env
MCP_TOKEN="your-secret-token"
```

### Step 2 — Edit Claude Desktop config

Open `claude_desktop_config.json`:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add:
```json
{
  "mcpServers": {
    "hypernexus-crm": {
      "type": "http",
      "url": "http://localhost:3001/api/mcp",
      "headers": {
        "Authorization": "Bearer your-secret-token"
      }
    }
  }
}
```

A ready-to-copy example is in [`mcp/claude_desktop_config.example.json`](mcp/claude_desktop_config.example.json).

### Step 3 — Restart Claude Desktop

After restarting, ask Claude things like:
- *"Summarize my brokerage"*
- *"Search contacts for 'John'"*
- *"Create a task to follow up with the Smith offer"*

> **Note:** The exact config format varies by Claude Desktop version. See
> [modelcontextprotocol.io/clients](https://modelcontextprotocol.io/clients) for the latest.

---

## 5. External Resources

| Resource | URL |
|----------|-----|
| Model Context Protocol (official) | https://modelcontextprotocol.io |
| MCP spec & GitHub | https://github.com/modelcontextprotocol |
| MCP clients (Claude, Cursor, etc.) | https://modelcontextprotocol.io/clients |

> **Important:** HyperNexus is the name of this CRM's built-in orchestration engine.
> It is not a separate downloadable product. MCP is the open standard it speaks —
> learn more at the links above.

---

## 6. FAQ

**Is HyperNexus a separate download?**
No. HyperNexus is built into this CRM (the `/api/mcp` endpoint and the workflow engine). External agents connect to it via MCP — the open standard you can learn about at modelcontextprotocol.io.

**Do I need API keys for HyperNexus commands?**
Basic commands (list, summarize, create task, update lead) work without any AI keys — they're deterministic database actions. Unknown commands that need AI interpretation require keys in the *AI Models* tab.

**Can I connect more than one AI agent?**
Yes. Any MCP-compatible client can connect to `/api/mcp` with the same token, or use its own session cookie.

**Is the MCP endpoint secure?**
It requires either a session cookie or a bearer token (`MCP_TOKEN`). For production, always set a strong `MCP_TOKEN` and serve over HTTPS.

**How do workflows differ from commands?**
Commands are one-off (you type, it runs). Workflows are standing rules that fire automatically whenever a CRM event matches their trigger + condition.
