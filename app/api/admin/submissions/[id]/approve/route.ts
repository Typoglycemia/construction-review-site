// app/api/admin/submissions/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeCompanyName, buildFaviconUrl } from "@/lib/dedupe";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: submission } = await supabaseAdmin
    .from("company_submissions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!submission) {
    return NextResponse.redirect(new URL("/admin/submissions", req.url));
  }

  const d = submission.submitted_data as any;

  await supabaseAdmin.from("companies").insert({
    name: d.name,
    normalized_name: normalizeCompanyName(d.name),
    prefecture: d.prefecture,
    city: d.city,
    phone: d.phone,
    website_url: d.websiteUrl,
    corporate_number: d.corporateNumber,
    category: d.category,
    logo_url: d.logoUrl || buildFaviconUrl(d.websiteUrl),
    contractor_type: d.contractorType || "unknown",
    source_type: "user_submission",
    status: "published",
  });

  await supabaseAdmin
    .from("company_submissions")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.redirect(new URL("/admin/submissions", req.url));
}
