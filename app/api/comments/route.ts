// app/api/comments/route.ts
// 匿名コメントの投稿API。リスク判定でstatusを自動振り分けする。

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateAnonymousIdentifier,
  hashIdentifier,
  hashIp,
  encryptIp,
  parseUserAgent,
  cookieConfig,
} from "@/lib/anonymous";
import { calculateCommentRiskScore } from "@/lib/moderation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SALT = process.env.IP_HASH_SALT!;
const IP_KEY = process.env.IP_ENCRYPTION_KEY!;
const MAX_BODY_LENGTH = 1000;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, sentiment, nickname, commentBody, turnstileToken } = body;

  if (!companyId || !["good", "bad"].includes(sentiment) || !commentBody?.trim()) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (commentBody.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "body_too_long" }, { status: 400 });
  }

  const botOk = await verifyTurnstile(turnstileToken);
  if (!botOk) {
    return NextResponse.json({ error: "bot_verification_failed" }, { status: 403 });
  }

  let identifier = req.cookies.get(cookieConfig.name)?.value;
  const isNewIdentifier = !identifier;
  if (!identifier) identifier = generateAnonymousIdentifier();
  const identifierHash = hashIdentifier(identifier, SALT);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip, SALT);
  const ipEncrypted = ip !== "unknown" ? encryptIp(ip, IP_KEY) : null;
  const ua = req.headers.get("user-agent") ?? "";
  const { deviceType } = parseUserAgent(ua);

  const [{ count: recentCount }, { data: recentCompanies }] = await Promise.all([
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("anonymous_identifier_hash", identifierHash)
      .gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString()),
    supabase
      .from("comments")
      .select("company_id")
      .eq("anonymous_identifier_hash", identifierHash)
      .gte("created_at", new Date(Date.now() - 24 * 3_600_000).toISOString()),
  ]);

  const distinctCompanies = new Set((recentCompanies ?? []).map((c) => c.company_id)).size;

  const { riskScore, status, flags } = calculateCommentRiskScore({
    body: commentBody,
    commentsInLast10Min: recentCount ?? 0,
    distinctCompaniesCommentedRecently: distinctCompanies,
  });

  // 個人情報・脅迫の疑いが強い場合は即座に拒否(投稿自体させない)
  if (flags.includes("possible_threat")) {
    return NextResponse.json(
      { error: "content_rejected", message: "投稿内容に問題があるため受け付けられません。" },
      { status: 400 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("comments")
    .insert({
      company_id: companyId,
      anonymous_identifier_hash: identifierHash,
      sentiment,
      nickname: nickname?.slice(0, 30) || null,
      body: commentBody.trim(),
      status,
      risk_score: riskScore,
	ip_hash: ipHash,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  await supabase.from("access_logs").insert({
    company_id: companyId,
    ip_address_encrypted: ipEncrypted,
    ip_hash: ipHash,
    user_agent: ua,
    device_type: deviceType,
  });

  const res = NextResponse.json({
    ok: true,
    comment: status === "published" ? inserted : null,
    pendingReview: status === "pending_review",
  });
  if (isNewIdentifier) {
    res.cookies.set(cookieConfig.name, identifier, cookieConfig);
  }
  return res;
}

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token) return false;
  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = await resp.json();
	console.log("Turnstile verify result:", data);
  return data.success === true;
}
