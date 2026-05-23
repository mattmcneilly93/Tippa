import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { syncSupportedTournaments } from "@/lib/tournaments/sync";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron && (!env.cronSecret || secret !== env.cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncSupportedTournaments();
  return NextResponse.json({ ok: true, results });
}
