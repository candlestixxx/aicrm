import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { searchTools, callTool, listCatalog } from '@/lib/hypernexus/tools';

/**
 * HyperNexus tool catalog proxy.
 * GET  /api/hypernexus/tools?query=  → search the catalog
 * GET  /api/hypernexus/tools?catalog=1 → list catalog
 * POST /api/hypernexus/tools          → call a tool
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get('catalog') === '1') {
    const res = await listCatalog();
    return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
  }

  const query = url.searchParams.get('query');
  if (!query) {
    return NextResponse.json({ error: 'query param required' }, { status: 400 });
  }

  const res = await searchTools(query, parseInt(url.searchParams.get('limit') || '20'));
  return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: 'Tool name required' }, { status: 400 });
  }

  const res = await callTool(body.name, body.arguments || {});
  return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
}
