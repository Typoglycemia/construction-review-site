// lib/seo.ts
// ページタイトル・構造化データ(JSON-LD)生成ヘルパー
// 45章の方針: 悪い評価ページでも「詐欺業者」「悪徳業者」等の断定表現は自動生成しない
import type { Company, VoteSummary } from "@/lib/supabase";
export function buildCompanyPageTitle(company: Company): string {
  return `${company.name}は良い？悪い？評判・匿名コメント｜下請けドットコム`;
}
export function buildCompanyPageDescription(company: Company, votes: VoteSummary): string {
  const total = votes.goodCount + votes.badCount;
  const goodPct = total > 0 ? Math.round((votes.goodCount / total) * 100) : null;
  const location = [company.prefecture, company.city].filter(Boolean).join("");
  if (goodPct === null) {
    return `${location}の${company.name}について、匿名投票・匿名コメントで評判をチェック。まだ投票はありません。`;
  }
  return `${location}の${company.name}の評判。良い！${goodPct}%(総投票数${total}件)。実際の利用者による匿名コメントも掲載中。`;
}
export function buildPrefecturePageTitle(prefecture: string): string {
  return `${prefecture}の建築・建設会社・工務店・リフォーム会社の口コミ・評判一覧｜下請けドットコム`;
}
export function buildCategoryPageTitle(categoryLabel: string): string {
  return `${categoryLabel}業者の口コミ・評判一覧｜下請けドットコム`;
}
export function buildRankingPageTitle(type: "good" | "bad"): string {
  return type === "good"
    ? "建設業者 良い評価ランキング｜匿名投票による評判サイト"
    : "建設業者 評価ランキング(投票結果)｜匿名投票による評判サイト";
  // 「悪徳業者ランキング」等の断定的なタイトルは使わない
}
/** 業者詳細ページ用の構造化データ(schema.org LocalBusiness + AggregateRating) */
export function buildCompanyJsonLd(company: Company, votes: VoteSummary) {
  const total = votes.goodCount + votes.badCount;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    address: {
      "@type": "PostalAddress",
      addressRegion: company.prefecture,
      addressLocality: company.city ?? undefined,
      streetAddress: company.address ?? undefined,
    },
    telephone: company.phone ?? undefined,
    url: company.website_url ?? undefined,
  };
  // 投票が一定数ある場合のみAggregateRatingを付与(0件やごく少数では出さない)
  if (total >= 5) {
    // 5段階評価に変換(良い!の割合を1〜5にマッピング)。星評価ではないため補助的な扱いに留める。
    const ratingValue = (1 + (votes.goodCount / total) * 4).toFixed(1);
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount: total,
      bestRating: "5",
      worstRating: "1",
    };
  }
  return jsonLd;
}
/** サイト全体の注意書き(断定的な表現を避けるための定型文。ランキング/詳細ページ共通) */
export const RANKING_DISCLAIMER =
  "このランキング・評価はユーザーによる匿名投票・匿名コメントをもとに集計されたものであり、当サイトが業者の品質・安全性・違法性等を保証または断定するものではありません。";
