// app/api/admin/companies/merge/route.ts
// 重複業者の統合/却下。統合時は投票・コメントを付け替え、旧業者は merged ステータスにする。

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { candidateId, mergeIntoId, mergedFromId, reject, adminId } = await req.json();

  if (reject) {
    await supabaseAdmin
      .from("company_merge_candidates")
      .update({ status: "rejected" })
      .eq("id", candidateId);

    await supabaseAdmin.from("admin_actions").insert({
      admin_id: adminId ?? null,
      action_type: "merge_candidate_rejected",
      target_type: "company_merge_candidate",
      target_id: candidateId,
    });

    return NextResponse.json({ ok: true });
  }

  if (!mergeIntoId || !mergedFromId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // 投票・コメントを統合先business_idへ付け替え
  await Promise.all([
    supabaseAdmin.from("votes").update({ company_id: mergeIntoId }).eq("company_id", mergedFromId),
    supabaseAdmin
      .from("comments")
      .update({ company_id: mergeIntoId })
      .eq("company_id", mergedFromId),
    supabaseAdmin
      .from("company_aliases")
      .update({ company_id: mergeIntoId })
      .eq("company_id", mergedFromId),
  ]);

  // 旧業者は merged ステータスにし、統合先IDを記録(旧URLからのリダイレクトに使用)
  await supabaseAdmin
    .from("companies")
    .update({ status: "merged", merged_into_id: mergeIntoId })
    .eq("id", mergedFromId);

  await supabaseAdmin
    .from("company_merge_candidates")
    .update({ status: "merged" })
    .eq("id", candidateId);

  await supabaseAdmin.from("admin_actions").insert({
    admin_id: adminId ?? null,
    action_type: "companies_merged",
    target_type: "company",
    target_id: mergeIntoId,
    detail: { mergedFromId, candidateId },
  });

  return NextResponse.json({ ok: true });
}
