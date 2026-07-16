// app/api/cron/ranking-batch/route.ts
// Vercel Cron等から定期呼び出しされるエンドポイント。
// CRON_SECRETをヘッダーで検証し、外部から不正に叩けないようにする。

import { NextRequest, NextResponse } from "next/server";
import { runRankingBatch } from "@/scripts/ranking-batch";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runRankingBatch();
  return NextResponse.json({ ok: true, ...result });
}
