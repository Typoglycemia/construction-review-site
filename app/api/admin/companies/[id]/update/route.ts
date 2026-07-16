// app/api/admin/companies/[id]/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeCompanyName } from "@/lib/dedupe";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const form = await req.formData();

  const name = String(form.get("name") ?? "");
  const updates = {
    name,
    normalized_name: normalizeCompanyName(name),
    prefecture: String(form.get("prefecture") ?? ""),
    city: String(form.get("city") ?? "") || null,
    address: String(form.get("address") ?? "") || null,
    phone: String(form.get("phone") ?? "") || null,
    website_url: String(form.get("website_url") ?? "") || null,
    category: String(form.get("category") ?? "") || null,
    logo_url: String(form.get("logo_url") ?? "") || null,
    corporate_number: String(form.get("corporate_number") ?? "") || null,
    license_information: String(form.get("license_information") ?? "") || null,
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin.from("companies").update(updates).eq("id", params.id);

  return NextResponse.redirect(new URL("/admin/companies", req.url));
}
