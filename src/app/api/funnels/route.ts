import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { tenantId, name, domain } = await req.json();

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: "tenantId and name are required" },
        { status: 400 }
      );
    }

    const funnel = await prisma.funnel.create({
      data: {
        tenantId,
        name,
        domain,
        pages: {
          create: [
            {
              name: "Home",
              slug: "/home",
              content: { blocks: [] }, // Initial empty state for the builder
            },
          ],
        },
      },
      include: {
        pages: true,
      },
    });

    return NextResponse.json({ success: true, funnel });
  } catch (error) {
    console.error("Failed to create funnel:", error);
    return NextResponse.json(
      { error: "Failed to create funnel" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const funnels = await prisma.funnel.findMany({
      where: { tenantId },
      include: { pages: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, funnels });
  } catch (error) {
    console.error("Failed to fetch funnels:", error);
    return NextResponse.json({ error: "Failed to fetch funnels" }, { status: 500 });
  }
}
