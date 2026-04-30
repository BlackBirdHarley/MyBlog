import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { isbot } from "isbot";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { articleId, path, referrer } = body as {
      articleId?: string;
      path: string;
      referrer?: string;
    };

    const userAgent = req.headers.get("user-agent") ?? "";

    // Drop bots
    if (isbot(userAgent)) {
      return NextResponse.json({ ok: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const salt = process.env.ANALYTICS_SALT ?? "default-salt";
    const day = new Date().toISOString().slice(0, 10);
    const ipHash = createHash("sha256")
      .update(`${ip}:${salt}:${day}`)
      .digest("hex")
      .slice(0, 16);

    // Session ID = hash of ip + ua (stable within a browser session for deduplication)
    const sessionId = createHash("sha256")
      .update(`${ipHash}:${userAgent}`)
      .digest("hex")
      .slice(0, 16);

    // Deduplication: same session on same path within 30 min counts as one view
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recent = await prisma.pageView.findFirst({
      where: {
        sessionId,
        path,
        createdAt: { gte: thirtyMinutesAgo },
      },
      select: { id: true },
    });

    if (recent) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    await prisma.pageView.create({
      data: {
        articleId: articleId ?? null,
        path,
        referrer: referrer?.slice(0, 500) ?? null,
        userAgent: userAgent.slice(0, 500),
        device: parseDevice(userAgent),
        browser: parseBrowser(userAgent),
        ipHash,
        sessionId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never fail a page render because of tracking
    return NextResponse.json({ ok: true });
  }
}

function parseDevice(ua: string): string {
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}
