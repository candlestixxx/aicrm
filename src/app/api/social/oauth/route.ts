import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    let parsed;
    try {
      parsed = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { tenantId, platform } = parsed;

    if (!tenantId || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Mock OAuth flow completion - in reality this would validate an authorization code
    const account = await prisma.socialAccount.create({
      data: {
        tenantId,
        platform,
        accessToken: "mock_access_token_123", // Encrypt in production
        profileName: `Agent ${platform} Page`,
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error("OAuth completion failed:", error);
    return NextResponse.json({ error: "Failed to connect social account" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("Failed to fetch social accounts:", error);
    return NextResponse.json({ error: "Failed to fetch social accounts" }, { status: 500 });
  }
}
