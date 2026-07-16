// app/api/admin/edit-requests/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: request } = await supabaseAdmin
    .from("company_edit_requests")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!request) {
    return NextResponse.redirect(new URL("/admin/submissions", req.url));
  }

  const changes = request.proposed_changes as any;

  // フォームで空欄だった項目は既存の値を上書きしないよう、値がある項目だけ更新する
  const updates: Record<string, any> = {};
  if (changes.name) updates.name = changes.name;
  if (changes.address) updates.address = changes.address;
  if (changes.phone) updates.phone = changes.phone;
  if (changes.websiteUrl) updates.website_url = changes.websiteUrl;
  updates.updated_at = new Date().toISOString();

  await supabaseAdmin.from("companies").update(updates).eq("id", request.company_id);

  await supabaseAdmin
    .from("company_edit_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.redirect(new URL("/admin/submissions", req.url));
}
