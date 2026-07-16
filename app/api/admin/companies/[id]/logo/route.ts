// app/api/admin/companies/[id]/logo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { logoUrl } = await req.json();

  const { error } = await supabaseAdmin
    .from("companies")
    .update({ logo_url: logoUrl || null, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
