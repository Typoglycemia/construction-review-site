// app/api/admin/access-logs/decrypt-ip/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { decryptIp } from "@/lib/anonymous";

const IP_KEY = process.env.IP_ENCRYPTION_KEY!;

export async function POST(req: NextRequest) {
  const { accessLogId, adminId, reason } = await req.json();

  if (!accessLogId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (!reason || !reason.trim()) {
    return NextResponse.json(
      { error: "reason_required", message: "閲覧理由の入力が必要です。" },
      { status: 400 }
    );
  }

  const { data: log, error } = await supabaseAdmin
    .from("access_logs")
    .select("id, ip_address_encrypted")
    .eq("id", accessLogId)
    .maybeSingle();

  if (error || !log || !log.ip_address_encrypted) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let decrypted: string;
  try {
    decrypted = decryptIp(log.ip_address_encrypted, IP_KEY);
  } catch (e) {
    console.log("decrypt error:", e);
    return NextResponse.json({ error: "decrypt_failed" }, { status: 500 });
  }

  await supabaseAdmin.from("admin_access_logs").insert({
    admin_id: adminId ?? null,
    viewed_target_type: "ip_address",
    viewed_target_id: accessLogId,
    reason: reason.trim(),
  });

  return NextResponse.json({ ok: true, ip: decrypted });
}
