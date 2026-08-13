/**
 * Social OAuth configuration.
 *
 * Each platform requires client credentials (set as env vars).
 * The OAuth flow is:
 *   1. GET /api/social/connect?platform=facebook → redirect to provider
 *   2. Provider redirects to /api/social/callback/[platform]?code=...
 *   3. Callback exchanges code for token and stores (encrypted)
 */

export interface OAuthConfig {
  platform: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

export const OAUTH_PROVIDERS: Record<string, OAuthConfig> = {
  facebook: {
    platform: 'facebook',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
  },
  instagram: {
    platform: 'instagram',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scopes: ['instagram_basic', 'instagram_content_publish'],
    clientIdEnv: 'INSTAGRAM_CLIENT_ID',
    clientSecretEnv: 'INSTAGRAM_CLIENT_SECRET',
  },
  linkedin: {
    platform: 'linkedin',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['w_member_social', 'r_organization_social'],
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
  },
  youtube: {
    platform: 'youtube',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    clientIdEnv: 'YOUTUBE_CLIENT_ID',
    clientSecretEnv: 'YOUTUBE_CLIENT_SECRET',
  },
  google_business: {
    platform: 'google_business',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/business.manage'],
    clientIdEnv: 'GOOGLE_BUSINESS_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_BUSINESS_CLIENT_SECRET',
  },
};

export function buildAuthUrl(platform: string, redirectUri: string, state: string): string {
  const config = OAUTH_PROVIDERS[platform];
  if (!config) throw new Error(`Unsupported platform: ${platform}`);

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) {
    throw new Error(
      `${config.clientIdEnv} is not configured. Set it in your environment to enable ${platform} OAuth.`
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCode(
  platform: string,
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
  const config = OAUTH_PROVIDERS[platform];
  if (!config) throw new Error(`Unsupported platform: ${platform}`);

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    throw new Error(
      `${config.clientIdEnv} and ${config.clientSecretEnv} must be configured`
    );
  }

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`);
  }

  const data = await res.json();
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : undefined;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  };
}
