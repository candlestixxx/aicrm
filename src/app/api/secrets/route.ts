import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { encrypt } from '@/lib/encryption';

export const SECRET_CATEGORIES = [
  { value: 'api_key', label: 'API Keys', icon: 'key' },
  { value: 'oauth', label: 'OAuth Tokens', icon: 'link' },
  { value: 'password', label: 'Passwords', icon: 'lock' },
  { value: 'note', label: 'Notes & Important Info', icon: 'file' },
  { value: 'other', label: 'Other', icon: 'box' },
] as const;

/**
 * Secure Vault — stores encrypted secrets organized by category.
 * List responses NEVER include decrypted values — only labels + metadata.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const category = new URL(request.url).searchParams.get('category');

  try {
    const secrets = await prisma.secret.findMany({
      where: {
        brokerageId: session.brokerageId,
        ...(category && category !== 'all' ? { category } : {}),
      },
      select: {
        id: true,
        category: true,
        label: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        // value is NEVER returned in lists — only via single-item reveal
      },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });

    return NextResponse.json({
      secrets: secrets.map((s) => ({
        ...s,
        metadata: s.metadata ? JSON.parse(s.metadata) : null,
      })),
      categories: SECRET_CATEGORIES,
    });
  } catch (error) {
    console.error('Error fetching secrets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch secrets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { category, label, value, metadata } = body;

    if (!category || !label || !value) {
      return NextResponse.json(
        { error: 'Category, label, and value are required' },
        { status: 400 }
      );
    }

    if (!SECRET_CATEGORIES.some((c) => c.value === category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const secret = await prisma.secret.create({
      data: {
        brokerageId: session.brokerageId!,
        category,
        label,
        value: encrypt(value),
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      select: {
        id: true,
        category: true,
        label: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        secret: {
          ...secret,
          metadata: secret.metadata ? JSON.parse(secret.metadata) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating secret:', error);
    return NextResponse.json(
      { error: 'Failed to store secret' },
      { status: 500 }
    );
  }
}
