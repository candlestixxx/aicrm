# MCP Server Config Examples

This folder contains ready-to-use configuration examples for connecting
external AI agents to the HyperNexus MCP server (`/api/mcp`).

## Files

| File | Purpose |
|------|---------|
| `claude_desktop_config.example.json` | Claude Desktop MCP server config |

## Setup

1. Copy the example config.
2. Replace `YOUR_MCP_TOKEN_HERE` with the value of `MCP_TOKEN` from your `.env`.
3. Merge into your client's MCP config:
   - **Claude Desktop (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Claude Desktop (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`
4. Restart the client.

## Full guide

See [`HYPERNEXUS.md`](../HYPERNEXUS.md) for the complete user guide,
including commands, workflows, tool reference, and troubleshooting.

## Protocol

- Spec: https://modelcontextprotocol.io
- HyperNexus endpoint: `POST http://localhost:3001/api/mcp`
- Auth header: `Authorization: Bearer <MCP_TOKEN>`
