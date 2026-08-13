import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/jwt';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
