import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard-store";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ leaderboard: [] });
  }
}
