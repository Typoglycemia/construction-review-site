// app/api/admin/submissions/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await supabaseAdmin
    .from("company_submissions")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.redirect(new URL("/admin/submissions", req.url));
}
