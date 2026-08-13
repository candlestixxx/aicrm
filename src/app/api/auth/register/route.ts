import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie, SessionPayload } from '@/lib/auth/jwt';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rl = rateLimit({
    limit: 5,
    windowMs: 60 * 60 * 1000,
    identifier: `register:${getClientIp(request)}`,
  });

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { email, password, name, brokerageName } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create brokerage if name provided, otherwise use a default
    let brokerageId: string;
    if (brokerageName) {
      const brokerage = await prisma.brokerage.create({
        data: {
          name: brokerageName,
          slug: brokerageName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        },
      });
      brokerageId = brokerage.id;

      // Create default pipeline for the brokerage
      const pipeline = await prisma.pipeline.create({
        data: {
          name: 'Default Pipeline',
          brokerageId,
          isDefault: true,
        },
      });

      // Create default stages
      const stages = [
        { name: 'New Lead', order: 0, color: '#6b7280' },
        { name: 'Contacted', order: 1, color: '#3b82f6' },
        { name: 'Showing Scheduled', order: 2, color: '#8b5cf6' },
        { name: 'Offer Made', order: 3, color: '#f59e0b' },
        { name: 'Negotiation', order: 4, color: '#ef4444' },
        { name: 'Closed Won', order: 5, color: '#10b981' },
        { name: 'Closed Lost', order: 6, color: '#6b7280' },
      ];

      await prisma.pipelineStage.createMany({
        data: stages.map((s) => ({ ...s, pipelineId: pipeline.id })),
      });
    } else {
      // Create a personal brokerage
      const brokerage = await prisma.brokerage.create({
        data: {
          name: `${name}'s Brokerage`,
          slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        },
      });
      brokerageId = brokerage.id;

      const pipeline = await prisma.pipeline.create({
        data: {
          name: 'Default Pipeline',
          brokerageId,
          isDefault: true,
        },
      });

      const stages = [
        { name: 'New Lead', order: 0, color: '#6b7280' },
        { name: 'Contacted', order: 1, color: '#3b82f6' },
        { name: 'Showing Scheduled', order: 2, color: '#8b5cf6' },
        { name: 'Offer Made', order: 3, color: '#f59e0b' },
        { name: 'Negotiation', order: 4, color: '#ef4444' },
        { name: 'Closed Won', order: 5, color: '#10b981' },
        { name: 'Closed Lost', order: 6, color: '#6b7280' },
      ];

      await prisma.pipelineStage.createMany({
        data: stages.map((s) => ({ ...s, pipelineId: pipeline.id })),
      });
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'admin',
      },
    });

    // Create the agent profile
    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        brokerageId,
        title: 'Agent',
      },
    });

    const payload: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      brokerageId,
      agentId: agent.id,
    };

    const token = await createSessionToken(payload);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agentProfile: agent,
          brokerageId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
