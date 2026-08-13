import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { handleMCPRequest } from '@/lib/mcp/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * HyperNexus MCP endpoint.
 *
 * Accepts JSON-RPC 2.0 requests over HTTP POST. Compatible with
 * MCP HTTP transport (https://modelcontextprotocol.io).
 *
 * Authentication:
 *   - Session cookie (browser / same-origin clients)
 *   - OR `Authorization: Bearer <MCP_TOKEN>` header (external agents)
 *     where MCP_TOKEN is set in your environment.
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit({
    limit: 120,
    windowMs: 60 * 1000,
    identifier: `mcp:${getClientIp(request)}`,
  });

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  // Authenticate via session cookie or bearer token
  let session;
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const expected = process.env.MCP_TOKEN;
    if (!expected || token !== expected) {
      return NextResponse.json(
        { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Invalid MCP token' } },
        { status: 401 }
      );
    }
    // Token auth: resolve brokerage from token (single-brokerage dev mode)
    const firstAgent = await import('@/lib/db/prisma').then((m) =>
      m.default.agent.findFirst({ select: { id: true, brokerageId: true } })
    );
    if (!firstAgent) {
      return NextResponse.json(
        { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'No brokerage found' } },
        { status: 404 }
      );
    }
    session = { brokerageId: firstAgent.brokerageId, agentId: firstAgent.id };
  } else {
    const s = await getSession();
    if (!s) {
      return NextResponse.json(
        { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    session = { brokerageId: s.brokerageId!, agentId: s.agentId };
  }

  let body: { method?: string; params?: Record<string, unknown>; id?: number | string | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: invalid JSON' } },
      { status: 400 }
    );
  }

  const { method, params = {}, id = null } = body;

  if (!method) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request: method required' } },
      { status: 400 }
    );
  }

  const response = await handleMCPRequest(method, params, id, session);
  return NextResponse.json(response);
}
