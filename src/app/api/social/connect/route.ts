import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import { buildAuthUrl, OAUTH_PROVIDERS } from '@/lib/social/oauth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const platform = new URL(request.url).searchParams.get('platform');

  if (!platform) {
    return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
  }

  if (!OAUTH_PROVIDERS[platform]) {
    return NextResponse.json(
      { error: `Unsupported platform: ${platform}` },
      { status: 400 }
    );
  }

  try {
    const baseUrl = process.env.APP_URL || `http://${request.headers.get('host')}`;
    const redirectUri = `${baseUrl}/api/social/callback/${platform}`;
    const state = `${session.agentId}:${Date.now()}`;

    const authUrl = buildAuthUrl(platform, redirectUri, state);

    return NextResponse.json({ authUrl, platform });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'OAuth not configured for this platform',
      },
      { status: 400 }
    );
  }
}
