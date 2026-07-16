// app/ranking/[type]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabase";
import { buildRanking } from "@/lib/ranking";
import { buildRankingPageTitle, RANKING_DISCLAIMER } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { type: string };
}): Promise<Metadata> {
  if (params.type !== "good" && params.type !== "bad") return {};
  return { title: buildRankingPageTitle(params.type) };
}

export default async function RankingPage({ params }: { params: { type: string } }) {
  if (params.type !== "good" && params.type !== "bad") notFound();
  const type = params.type as "good" | "bad";

  // 本来は lib/ranking-batch.ts のバッチ処理結果(キャッシュテーブル)を読む。
  // ここでは簡易的にオンデマンド集計する実装例。
  const { data: companies } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url")
    .eq("status", "published")
    .limit(1000);

  const { data: votes } = await supabasePublic
    .from("votes")
    .select("company_id, vote_type")
    .eq("is_valid", true);

  const counts = new Map<string, { good: number; bad: number }>();
  for (const v of votes ?? []) {
    const c = counts.get(v.company_id) ?? { good: 0, bad: 0 };
    if (v.vote_type === "good") c.good++;
    else c.bad++;
    counts.set(v.company_id, c);
  }

  const ranked = buildRanking(
    (companies ?? []).map((c) => ({
      companyId: c.id,
      counts: { goodCount: counts.get(c.id)?.good ?? 0, badCount: counts.get(c.id)?.bad ?? 0 },
    })),
    type
  ).slice(0, 100);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">
        {type === "good" ? "良い業者ランキング" : "悪い業者ランキング"}
      </h1>
      <ol className="space-y-2">
        {ranked.map((r, i) => {
          const company = companies!.find((c) => c.id === r.companyId)!;
          const pct = Math.round((type === "good" ? r.goodScore : r.badScore) * 100);
          return (
            <li key={r.companyId}>
              <Link
                href={`/companies/${r.companyId}`}
                className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50"
              >
                <span className="w-6 text-gray-400">{i + 1}</span>
                <span className="flex-1 truncate">{company.name}</span>
                <span className="text-sm text-gray-500">
                  {company.prefecture}
                  {company.city}
                </span>
                <span className="text-sm font-medium">{pct}%</span>
                <span className="text-xs text-gray-400">({r.totalVotes}票)</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-gray-400 mt-6">{RANKING_DISCLAIMER}</p>
    </main>
  );
}
