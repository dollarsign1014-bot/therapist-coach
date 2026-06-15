import { NextRequest, NextResponse } from "next/server";
import { recordSession } from "@/lib/leaderboard-store";
export async function POST(req: NextRequest) {
  const { username, date } = await req.json();
  if (!username || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  try {
    const stats = await recordSession(username, date);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Session recording failed" }, { status: 500 });
  }
}
