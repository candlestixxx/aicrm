import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { hypernexusHealth, HYPERNEXUS_URL } from '@/lib/hypernexus/client';

/**
 * HyperNexus Kernel bridge — status.
 * GET /api/hypernexus/kernel
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const health = await hypernexusHealth();
  return NextResponse.json({
    connected: health !== null,
    url: HYPERNEXUS_URL,
    health,
  });
}
