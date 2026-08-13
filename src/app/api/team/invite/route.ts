import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';
import { sendEmail } from '@/lib/mailer';
import crypto from 'crypto';

/**
 * Team invite flow:
 * 1. Admin submits email + optional team
 * 2. Generates a secure invite token
 * 3. Sends email with registration link containing the token
 * 4. User registers via /register?invite=TOKEN
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if already a member
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 409 }
      );
    }

    // Generate invite token (24h expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: `invite:${email}`,
        token,
        expires,
      },
    });

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/register?invite=${token}&email=${encodeURIComponent(email)}`;

    const broker = await prisma.brokerage.findUnique({
      where: { id: session.brokerageId },
      select: { name: true },
    });

    await sendEmail({
      to: email,
      subject: `You're invited to join ${broker?.name || 'our brokerage'} on AiCRM`,
      text: `You've been invited to join ${broker?.name || 'our brokerage'} on AiCRM.\n\nClick the link below to create your account:\n${inviteLink}\n\nThis invite expires in 24 hours.`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent to ${email}`,
        token, // Returned in dev so it can be tested without email
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
