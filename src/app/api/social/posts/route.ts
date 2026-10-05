import { NextResponse } from "next/server";
import { generateAgenticContent } from "@/lib/agents/contentCreator";
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    let parsed;
    try {
      parsed = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { tenantId, topic, platforms } = parsed;

    if (!tenantId || !topic || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Call the Agentic Content Creator loop
    const content = await generateAgenticContent(topic);

    const posts = [];
    for (const platform of platforms) {
      // Find the account for this platform
      const account = await prisma.socialAccount.findFirst({
        where: { tenantId, platform },
      });

      if (account) {
        // Create the post draft
        const post = await prisma.socialPost.create({
          data: {
            socialAccountId: account.id,
            content: content,
            status: "DRAFT",
          },
        });
        posts.push(post);
      }
    }

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Failed to generate content:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const posts = await prisma.socialPost.findMany({
      where: {
        socialAccount: {
          tenantId: tenantId
        }
      },
      include: {
        socialAccount: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
