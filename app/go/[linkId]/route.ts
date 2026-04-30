import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  const articleId = req.nextUrl.searchParams.get("article") ?? undefined;

  const [link, session] = await Promise.all([
    prisma.affiliateLink.findUnique({
      where: { id: linkId, isActive: true },
      select: { targetUrl: true },
    }),
    auth(),
  ]);

  if (!link) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Skip tracking for admin users
  if (!session) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";
    const salt = process.env.ANALYTICS_SALT ?? "default-salt";
    const day = new Date().toISOString().slice(0, 10);
    const ipHash = createHash("sha256").update(`${ip}:${salt}:${day}`).digest("hex").slice(0, 16);
    const userAgent = req.headers.get("user-agent") ?? "";
    const device = parseDevice(userAgent);

    prisma.linkClick.create({
      data: {
        linkId,
        articleId: articleId ?? null,
        referrer: req.headers.get("referer") ?? null,
        userAgent: userAgent.slice(0, 500),
        device,
        ipHash,
      },
    }).catch(() => {});
  }

  return NextResponse.redirect(link.targetUrl, { status: 302 });
}

function parseDevice(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}
