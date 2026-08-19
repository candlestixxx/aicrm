import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { listEngines, getAIEngine } from '@/lib/ai/engine';

/**
 * AI Engine registry — lists the two "brains" (Native + Control Plane)
 * and which one is currently active.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const active = getAIEngine();
  return NextResponse.json({
    active: active.name,
    activeVersion: active.version,
    engines: listEngines(),
    note: 'Set AI_ENGINE=native|controlplane|hybrid in .env to change the default.',
  });
}
