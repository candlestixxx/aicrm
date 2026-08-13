import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { hypernexusMemoryAdd, hypernexusMemorySearch } from '@/lib/hypernexus/client';

/**
 * HyperNexus Kernel bridge — memory.
 * GET  /api/hypernexus/kernel/memory?query=  → search
 * POST /api/hypernexus/kernel/memory          → add
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get('query');
  if (!query) {
    return NextResponse.json({ error: 'query param required' }, { status: 400 });
  }

  const res = await hypernexusMemorySearch(query);
  return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const res = await hypernexusMemoryAdd({
    namespace: body.namespace || 'aicrm',
    type: body.type || 'working',
    content: body.content,
    tags: body.tags || [],
  });
  return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
}
