// app/api/takedown-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { target, requestType, detail, contactEmail } = await req.json();
  if (!target || !requestType || !detail || !contactEmail) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("takedown_requests").insert({
    detail: `[対象] ${target}\n[連絡先] ${contactEmail}\n\n${detail}`,
    request_type: requestType,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
