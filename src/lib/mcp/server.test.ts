import { describe, it, expect } from 'vitest';
import {
  MCP_TOOLS,
  MCP_PROTOCOL_VERSION,
  SERVER_NAME,
  handleMCPRequest,
  MCPSession,
} from './server';

describe('HyperNexus MCP Server', () => {
  it('should expose protocol version and server info', () => {
    expect(MCP_PROTOCOL_VERSION).toBeTruthy();
    expect(SERVER_NAME).toBe('hypernexus-crm');
  });

  it('should define tools with name, description, and inputSchema', () => {
    expect(MCP_TOOLS.length).toBeGreaterThan(5);
    for (const tool of MCP_TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
    }
  });

  it('should have unique tool names', () => {
    const names = MCP_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should include core CRM tools', () => {
    const names = MCP_TOOLS.map((t) => t.name);
    expect(names).toContain('list_contacts');
    expect(names).toContain('update_lead_stage');
    expect(names).toContain('summarize_brokerage');
    expect(names).toContain('create_task');
    expect(names).toContain('list_properties');
  });

  it('should handle initialize handshake', async () => {
    const session: MCPSession = { brokerageId: 'b1', agentId: 'a1' };
    const res = await handleMCPRequest('initialize', {}, 1, session);

    expect(res.jsonrpc).toBe('2.0');
    expect(res.id).toBe(1);
    expect((res.result as { protocolVersion: string }).protocolVersion).toBe(
      MCP_PROTOCOL_VERSION
    );
    expect(
      (res.result as { serverInfo: { name: string } }).serverInfo.name
    ).toBe(SERVER_NAME);
  });

  it('should list tools', async () => {
    const session: MCPSession = { brokerageId: 'b1' };
    const res = await handleMCPRequest('tools/list', {}, 2, session);

    const result = res.result as { tools: unknown[] };
    expect(result.tools.length).toBe(MCP_TOOLS.length);
  });

  it('should return error for unknown tools', async () => {
    const session: MCPSession = { brokerageId: 'b1' };
    const res = await handleMCPRequest(
      'tools/call',
      { name: 'nonexistent_tool', arguments: {} },
      3,
      session
    );

    expect(res.error).toBeTruthy();
    expect(res.error!.code).toBe(-32602);
  });

  it('should return error for unknown methods', async () => {
    const session: MCPSession = { brokerageId: 'b1' };
    const res = await handleMCPRequest('unknown/method', {}, 4, session);

    expect(res.error).toBeTruthy();
    expect(res.error!.code).toBe(-32601);
  });
});
