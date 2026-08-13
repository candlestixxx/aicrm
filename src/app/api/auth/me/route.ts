import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      agentProfile: {
        include: { brokerage: true, team: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    agentProfile: user.agentProfile,
  });
}
