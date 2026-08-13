import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { exchangeCode } from '@/lib/social/oauth';
import { encrypt } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/?socialError=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/?socialError=missing_code', request.url)
    );
  }

  const agentId = state.split(':')[0];

  try {
    const baseUrl = process.env.APP_URL || `http://${request.headers.get('host')}`;
    const redirectUri = `${baseUrl}/api/social/callback/${platform}`;

    const { accessToken, refreshToken, expiresAt } = await exchangeCode(
      platform,
      code,
      redirectUri
    );

    const encryptedToken = encrypt(accessToken);
    const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;

    await prisma.socialAccount.upsert({
      where: {
        agentId_platform: {
          agentId,
          platform,
        },
      },
      update: {
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        expiresAt,
      },
      create: {
        agentId,
        platform,
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/?socialConnected=${encodeURIComponent(platform)}`, request.url)
    );
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(
      new URL(
        `/?socialError=${encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')}`,
        request.url
      )
    );
  }
}
