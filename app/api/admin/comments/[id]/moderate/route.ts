// app/api/admin/comments/[id]/moderate/route.ts
// 管理者によるコメントの非公開化/復元/削除。moderation_logsとadmin_actionsに記録する。
// 認証(現在ログイン中の管理者の特定)は実運用ではmiddleware/セッションから取得すること。

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const STATUS_MAP: Record<string, string> = {
  hide: "hidden",
  restore: "published",
  delete: "deleted",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action, adminId, reason } = await req.json();
  const newStatus = STATUS_MAP[action];
  if (!newStatus) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("comments")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  await supabaseAdmin.from("moderation_logs").insert({
    admin_id: adminId ?? null,
    target_type: "comment",
    target_id: params.id,
    action,
    reason: reason ?? null,
  });

  await supabaseAdmin.from("admin_actions").insert({
    admin_id: adminId ?? null,
    action_type: `comment_${action}`,
    target_type: "comment",
    target_id: params.id,
  });

  return NextResponse.json({ ok: true });
}
