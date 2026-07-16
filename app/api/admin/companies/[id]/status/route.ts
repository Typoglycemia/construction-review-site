// app/api/admin/companies/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status, adminId, reason } = await req.json();
  if (!["hidden", "published"].includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("companies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  await supabaseAdmin.from("moderation_logs").insert({
    admin_id: adminId ?? null,
    target_type: "company",
    target_id: params.id,
    action: status === "hidden" ? "hide_company" : "restore_company",
    reason: reason ?? null,
  });

  await supabaseAdmin.from("admin_actions").insert({
    admin_id: adminId ?? null,
    action_type: `company_${status}`,
    target_type: "company",
    target_id: params.id,
  });

  return NextResponse.json({ ok: true });
}
