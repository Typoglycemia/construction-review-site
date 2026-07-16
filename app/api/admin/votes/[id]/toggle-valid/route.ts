// app/api/admin/votes/[id]/toggle-valid/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { isValid, adminId, reason } = await req.json();

  const { error } = await supabaseAdmin
    .from("votes")
    .update({
      is_valid: isValid,
      invalid_reason: isValid ? null : reason ?? "manual_admin_review",
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  await supabaseAdmin.from("moderation_logs").insert({
    admin_id: adminId ?? null,
    target_type: "vote",
    target_id: params.id,
    action: isValid ? "mark_valid" : "invalidate_vote",
    reason: reason ?? null,
  });

  return NextResponse.json({ ok: true });
}
