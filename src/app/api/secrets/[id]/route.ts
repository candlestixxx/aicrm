import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Single-secret operations.
 * GET    → reveal decrypted value (auth required, never cached)
 * PATCH  → update label/category/value/metadata
 * DELETE → remove
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const secret = await prisma.secret.findFirst({
      where: { id, brokerageId: session.brokerageId },
    });

    if (!secret) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: secret.id,
        category: secret.category,
        label: secret.label,
        value: decrypt(secret.value),
        metadata: secret.metadata ? JSON.parse(secret.metadata) : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Error revealing secret:', error);
    return NextResponse.json(
      { error: 'Failed to reveal secret' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.secret.findFirst({
      where: { id, brokerageId: session.brokerageId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }

    const body = await request.json();
    const { category, label, value, metadata } = body;

    const secret = await prisma.secret.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(label !== undefined && { label }),
        ...(value !== undefined && { value: encrypt(value) }),
        ...(metadata !== undefined && {
          metadata: metadata ? JSON.stringify(metadata) : null,
        }),
      },
      select: {
        id: true,
        category: true,
        label: true,
        metadata: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      secret: {
        ...secret,
        metadata: secret.metadata ? JSON.parse(secret.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Error updating secret:', error);
    return NextResponse.json(
      { error: 'Failed to update secret' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.secret.findFirst({
      where: { id, brokerageId: session.brokerageId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Secret not found' }, { status: 404 });
    }

    await prisma.secret.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting secret:', error);
    return NextResponse.json(
      { error: 'Failed to delete secret' },
      { status: 500 }
    );
  }
}
