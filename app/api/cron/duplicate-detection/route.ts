// app/api/cron/duplicate-detection/route.ts
// 毎日1回、DBのdetect_company_duplicates関数を呼び出し、
// 見つかった重複候補をcompany_merge_candidatesへ登録する(既存はスキップ)。
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: candidates, error } = await supabaseAdmin.rpc(
    "detect_company_duplicates",
    { name_similarity_threshold: 0.6 }
  );

  if (error) {
    return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
  }

  let inserted = 0;
  for (const c of candidates ?? []) {
    const { error: insertError } = await supabaseAdmin
      .from("company_merge_candidates")
      .upsert(
        {
          company_id_a: c.company_id_a,
          company_id_b: c.company_id_b,
          similarity_score: c.similarity_score,
          match_reason: c.match_reason,
          status: "pending",
        },
        { onConflict: "company_id_a,company_id_b", ignoreDuplicates: true }
      );
    if (!insertError) inserted++;
  }

  return NextResponse.json({
    ok: true,
    candidatesFound: (candidates ?? []).length,
    processed: inserted,
  });
}
