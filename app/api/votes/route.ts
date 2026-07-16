// app/api/votes/route.ts
// 投票の受付API。Cookie発行、IPハッシュ化、リスク判定、DB書き込みまでを行う。

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
import { voteRatelimit } from "@/lib/ratelimit";
import { calculateVoteRiskScore } from "@/lib/moderation";

// service_role key はサーバー専用。クライアントには絶対に露出させない。
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SALT = process.env.IP_HASH_SALT!;
const IP_KEY = process.env.IP_ENCRYPTION_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyId, voteType, turnstileToken } = body;

  if (!companyId || !["good", "bad"].includes(voteType)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

// 0. レートリミット(同一IPからの短時間大量アクセスを制限)
  const ipForLimit = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await voteRatelimit.limit(ipForLimit);
  if (!success) {
    return NextResponse.json(
      { error: "rate_limited", message: "しばらく時間をおいてから、もう一度お試しください。" },
      { status: 429 }
    );
  }

  // 1. Turnstile検証(Bot対策)
  const botOk = await verifyTurnstile(turnstileToken);
  if (!botOk) {
    return NextResponse.json({ error: "bot_verification_failed" }, { status: 403 });
  }

  // 2. 匿名識別子の解決(Cookieが無ければ新規発行)
  let identifier = req.cookies.get(cookieConfig.name)?.value;
  const isNewIdentifier = !identifier;
  if (!identifier) identifier = generateAnonymousIdentifier();
  const identifierHash = hashIdentifier(identifier, SALT);

  // 3. IP情報の取得・ハッシュ化・暗号化
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip, SALT);
  const ipEncrypted = ip !== "unknown" ? encryptIp(ip, IP_KEY) : null;
  const ua = req.headers.get("user-agent") ?? "";
  const { browser, os, deviceType } = parseUserAgent(ua);

  // 4. レートリミット・不正判定のための集計クエリ
  const [{ data: lastVote }, { count: votesInLastMinute }, { count: distinctIdentifiers }] =
    await Promise.all([
      supabase
        .from("votes")
        .select("created_at")
        .eq("company_id", companyId)
        .eq("anonymous_identifier_hash", identifierHash)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("anonymous_identifier_hash", identifierHash)
        .gte("created_at", new Date(Date.now() - 60_000).toISOString()),
      supabase
        .from("votes")
        .select("anonymous_identifier_hash", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", new Date(Date.now() - 3_600_000).toISOString()),
    ]);

  const { riskScore, isValid, invalidReason } = calculateVoteRiskScore({
    lastVoteAtForCompany: lastVote?.created_at ? new Date(lastVote.created_at) : null,
    votesInLastMinute: votesInLastMinute ?? 0,
    distinctIdentifiersFromIpInLastHour: distinctIdentifiers ?? 0,
    botScoreSuspicious: false, // Turnstileで既に検証済みなのでここでは基本false
  });

  // クールダウン違反(90日以内の再投票)は、そもそも新規行を作らずエラーを返す
  if (invalidReason === "revote_cooldown_violation") {
    return NextResponse.json(
      { error: "already_voted", message: "この業者には既に投票済みです。" },
      { status: 409 }
    );
  }

  // 5. 投票の書き込み
  const { error } = await supabase.from("votes").insert({
    company_id: companyId,
    vote_type: voteType,
    anonymous_identifier_hash: identifierHash,
    ip_hash: ipHash,
    is_valid: isValid,
    invalid_reason: invalidReason,
    risk_score: riskScore,
  });

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // 6. アクセスログ(暗号化IPは監査目的のみ、短期保存想定)
  await supabase.from("access_logs").insert({
    company_id: companyId,
    ip_address_encrypted: ipEncrypted,
    ip_hash: ipHash,
    user_agent: ua,
    browser,
    os,
    device_type: deviceType,
  });

  const res = NextResponse.json({ ok: true, isValid });
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
  return data.success === true;
}
