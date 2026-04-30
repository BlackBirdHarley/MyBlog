import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getTopLinks } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10");
  const data = await getTopLinks(days, limit);
  return NextResponse.json(data);
}
