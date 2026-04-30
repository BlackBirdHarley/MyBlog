import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getArticleStats } from "@/lib/analytics";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const data = await getArticleStats(id, days);
  return NextResponse.json(data);
}
