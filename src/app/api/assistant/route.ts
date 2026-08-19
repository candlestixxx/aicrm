import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import {
  nextBestAction,
  getNudges,
  leadHealth,
  matchProperties,
  generateCMA,
  enrichLead,
  dailyDigest,
} from '@/lib/assistant';

/**
 * AI Assistant endpoint.
 * GET /api/assistant?action=digest|nudges|health|match|next-best
 * POST /api/assistant?action=cma|enrich
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = new URL(request.url).searchParams.get('action') || 'digest';
  const brokerageId = session.brokerageId!;

  try {
    switch (action) {
      case 'digest':
        return NextResponse.json({ digest: await dailyDigest(brokerageId) });
      case 'nudges':
        return NextResponse.json({ nudges: await getNudges(brokerageId) });
      case 'health':
        return NextResponse.json({ atRisk: await leadHealth(brokerageId) });
      case 'match':
        return NextResponse.json({ matches: await matchProperties(brokerageId) });
      case 'next-best':
        return NextResponse.json({ ...(await nextBestAction(brokerageId)) });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Assistant error:', error);
    return NextResponse.json(
      { error: 'Assistant failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = new URL(request.url).searchParams.get('action') || 'cma';
  const body = await request.json().catch(() => ({}));

  try {
    switch (action) {
      case 'cma':
        if (!body.propertyId) {
          return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
        }
        return NextResponse.json({ result: await generateCMA(body.propertyId) });
      case 'enrich':
        if (!body.contactId) {
          return NextResponse.json({ error: 'contactId required' }, { status: 400 });
        }
        return NextResponse.json({ result: await enrichLead(body.contactId) });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Assistant error:', error);
    return NextResponse.json({ error: 'Assistant failed' }, { status: 500 });
  }
}
