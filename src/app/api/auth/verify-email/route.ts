import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/mailer';
import crypto from 'crypto';

/**
 * Request email verification (resend flow).
 * A verification token is created and "sent" (logged in dev).
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ success: true, message: 'If the email exists, a verification link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token,
        expires,
      },
    });

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const verifyLink = `${baseUrl}/api/auth/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Verify your AiCRM email',
      text: `Click this link to verify your email:\n${verifyLink}\n\nThis link expires in 24 hours.`,
    });

    return NextResponse.json({ success: true, message: 'Verification link sent.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Failed to send verification' }, { status: 500 });
  }
}

/**
 * Confirm email verification via token.
 */
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    if (!record.identifier.startsWith('verify:')) {
      return NextResponse.json(
        { error: 'Invalid verification token type' },
        { status: 400 }
      );
    }

    const email = record.identifier.replace('verify:', '');
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
