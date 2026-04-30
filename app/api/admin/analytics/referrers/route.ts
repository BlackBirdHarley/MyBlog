import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getTopReferrers } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const data = await getTopReferrers(days);
  return NextResponse.json(data);
}
