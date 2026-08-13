import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import {
  swarmStart,
  swarmDebate,
  swarmConsensus,
  swarmMissions,
} from '@/lib/hypernexus/swarm';

/**
 * HyperNexus swarm orchestration proxy.
 * GET  /api/hypernexus/swarm           → list missions
 * POST /api/hypernexus/swarm?action=start|debate|consensus
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await swarmMissions();
  return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = new URL(request.url).searchParams.get('action') || 'start';
  const body = await request.json().catch(() => ({}));

  let res;
  switch (action) {
    case 'debate':
      res = await swarmDebate(body.prompt || '');
      break;
    case 'consensus':
      res = await swarmConsensus(body.prompt || '', body.models || []);
      break;
    case 'start':
    default:
      res = await swarmStart();
      break;
  }

  return NextResponse.json(res.data, { status: res.ok ? 200 : 502 });
}
