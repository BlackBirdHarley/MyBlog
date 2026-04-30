import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getOverviewStats,
  getViewsOverTime,
  getDeviceBreakdown,
  getBrowserBreakdown,
} from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const [stats, viewsOverTime, devices, browsers] = await Promise.all([
    getOverviewStats(days),
    getViewsOverTime(days),
    getDeviceBreakdown(days),
    getBrowserBreakdown(days),
  ]);

  return NextResponse.json({ stats, viewsOverTime, devices, browsers });
}
