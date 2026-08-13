import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { executeCommand } from '@/lib/hypernexus/engine';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit({
    limit: 30,
    windowMs: 60 * 1000,
    identifier: `hypernexus:${getClientIp(request)}`,
  });

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const { command, useLLM } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    const result = await executeCommand(
      command,
      {
        brokerageId: session.brokerageId!,
        agentId: session.agentId,
      },
      { useLLMFallback: useLLM !== false }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('HyperNexus error:', error);
    return NextResponse.json(
      { error: 'Failed to process command' },
      { status: 500 }
    );
  }
}
