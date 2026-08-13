import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { hypernexusChat } from '@/lib/hypernexus/client';

/**
 * HyperNexus Kernel bridge — agent chat.
 * POST /api/hypernexus/kernel/chat
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const res = await hypernexusChat(body.prompt || body.message);
  return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
}
