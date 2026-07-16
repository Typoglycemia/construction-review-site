// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();
  if (!email || !message) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // 問い合わせ内容は個人情報(メールアドレス)を含むため、専用テーブルに保存し、
  // 一般公開データとは分離して管理者(support権限以上)のみ閲覧可能にする想定。
  const { error } = await supabaseAdmin.from("contact_messages").insert({
    name: name ?? null,
    email,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
