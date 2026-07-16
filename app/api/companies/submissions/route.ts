// app/api/companies/submissions/route.ts
// 業者の新規登録申請API。重複判定を行い、高信頼度の重複は登録前にブロックして
// 既存業者IDを返す。中信頼度の重複は登録を受け付けつつ管理者確認キューへ回す。

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { findDuplicateCandidates, normalizeCompanyName } from "@/lib/dedupe";
import { hashIdentifier, generateAnonymousIdentifier, cookieConfig } from "@/lib/anonymous";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const SALT = process.env.IP_HASH_SALT!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, prefecture, city, phone, websiteUrl, corporateNumber, category, logoUrl } = body;

  if (!name?.trim() || !prefecture?.trim()) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  // 同一都道府県+近い業種の既存業者を候補として取得(全件取得はスケールしないため、
  // 実運用では pg_trgm を使ったDB側の類似検索クエリに置き換える)
  const { data: existing } = await supabase
    .from("companies")
    .select(
      "id, name, normalized_name, corporate_number, phone, website_url, prefecture, city"
    )
    .eq("prefecture", prefecture)
    .eq("status", "published");

  const candidates = findDuplicateCandidates(
    { name, corporateNumber, phone, websiteUrl, prefecture, city },
    (existing ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      normalizedName: e.normalized_name,
      corporateNumber: e.corporate_number,
      phone: e.phone,
      websiteUrl: e.website_url,
      prefecture: e.prefecture,
      city: e.city,
    }))
  );

  const highConfidenceMatch = candidates.find((c) => c.confidence === "high");
  if (highConfidenceMatch) {
    // 高信頼度の重複: 登録せず、既存業者ページへ誘導する
    return NextResponse.json({
      ok: false,
      duplicate: true,
      confidence: "high",
      existingCompanyId: highConfidenceMatch.company.id,
      message: "この業者はすでに登録されている可能性があります。",
    });
  }

  let identifier = req.cookies.get(cookieConfig.name)?.value;
  const isNewIdentifier = !identifier;
  if (!identifier) identifier = generateAnonymousIdentifier();
  const identifierHash = hashIdentifier(identifier, SALT);

  const mediumMatch = candidates.find((c) => c.confidence === "medium");

  // 申請として保存。中信頼度の重複がある場合は company_submissions に
  // duplicate_candidate_id を付けて管理者確認へ回す(即時公開はしない)。
  const { data: submission, error } = await supabase
    .from("company_submissions")
    .insert({
      submitted_data: {
        name,
        normalizedName: normalizeCompanyName(name),
        prefecture,
        city,
        phone,
        websiteUrl,
        corporateNumber,
        category,
        logoUrl,
      },
      duplicate_candidate_id: mediumMatch?.company.id ?? null,
      anonymous_identifier_hash: identifierHash,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    submission,
    duplicate: !!mediumMatch,
    confidence: mediumMatch ? "medium" : null,
    message: mediumMatch
      ? "類似する業者が見つかったため、管理者の確認後に掲載されます。"
      : "登録申請を受け付けました。管理者の確認後に掲載されます。",
  });
  if (isNewIdentifier) {
    res.cookies.set(cookieConfig.name, identifier, cookieConfig);
  }
  return res;
}
