// app/api/companies/edit-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashIdentifier, generateAnonymousIdentifier, cookieConfig } from "@/lib/anonymous";

const SALT = process.env.IP_HASH_SALT!;

export async function POST(req: NextRequest) {
  const { companyId, proposedChanges } = await req.json();
  if (!companyId || !proposedChanges) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let identifier = req.cookies.get(cookieConfig.name)?.value;
  const isNewIdentifier = !identifier;
  if (!identifier) identifier = generateAnonymousIdentifier();
  const identifierHash = hashIdentifier(identifier, SALT);

  const { error } = await supabaseAdmin.from("company_edit_requests").insert({
    company_id: companyId,
    proposed_changes: proposedChanges,
    reason: proposedChanges.reason ?? null,
    anonymous_identifier_hash: identifierHash,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  if (isNewIdentifier) {
    res.cookies.set(cookieConfig.name, identifier, cookieConfig);
  }
  return res;
}
