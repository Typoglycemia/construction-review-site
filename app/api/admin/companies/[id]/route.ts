// app/api/admin/companies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin.from("companies").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  await supabaseAdmin.from("admin_actions").insert({
    action_type: "company_deleted",
    target_type: "company",
    target_id: params.id,
  });

  return NextResponse.json({ ok: true });
}
