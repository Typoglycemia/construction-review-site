// scripts/ranking-batch.ts
// 定期実行(Vercel Cron / Supabase Edge Function等)を想定したランキング再集計バッチ。
// 全業者の有効投票を集計し、site_stats / company_rankings テーブルへキャッシュする。
//
// 実行例(Vercel Cron): vercel.json に
// { "crons": [{ "path": "/api/cron/ranking-batch", "schedule": "*/15 * * * *" }] }
// を設定し、この処理をAPI Routeとして呼び出す。

import { createClient } from "@supabase/supabase-js";
import { calculateSiteAverageGoodRatio, buildRanking } from "@/lib/ranking";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAGE_SIZE = 1000;

export async function runRankingBatch() {
  // 1. 全業者(公開済み)を取得
  const companies: { id: string }[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from("companies")
      .select("id")
      .eq("status", "published")
      .range(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    companies.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // 2. 有効投票を業者IDごとに集計(件数が非常に多い場合はDB側でgroup byする方が効率的)
  const counts = new Map<string, { good: number; bad: number }>();
  from = 0;
  while (true) {
    const { data } = await supabase
      .from("votes")
      .select("company_id, vote_type")
      .eq("is_valid", true)
      .range(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    for (const v of data) {
      const c = counts.get(v.company_id) ?? { good: 0, bad: 0 };
      if (v.vote_type === "good") c.good++;
      else c.bad++;
      counts.set(v.company_id, c);
    }
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const inputs = companies.map((c) => ({
    companyId: c.id,
    counts: { goodCount: counts.get(c.id)?.good ?? 0, badCount: counts.get(c.id)?.bad ?? 0 },
  }));

  const siteAverageGoodRatio = calculateSiteAverageGoodRatio(inputs.map((i) => i.counts));

  const goodRanking = buildRanking(inputs, "good", { siteAverageGoodRatio });
  const badRanking = buildRanking(inputs, "bad", { siteAverageGoodRatio });

  // 3. サイト統計・ランキングキャッシュを保存
  await supabase.from("site_stats").upsert({
    id: "singleton",
    site_average_good_ratio: siteAverageGoodRatio,
    computed_at: new Date().toISOString(),
  });

  await supabase.from("company_rankings").delete().neq("company_id", "");
  const rows = inputs.map((i) => {
    const good = goodRanking.find((r) => r.companyId === i.companyId)!;
    const bad = badRanking.find((r) => r.companyId === i.companyId)!;
    return {
      company_id: i.companyId,
      good_score: good.goodScore,
      bad_score: bad.badScore,
      total_votes: good.totalVotes,
      computed_at: new Date().toISOString(),
    };
  });
  // バルクinsertは1000件単位でchunk推奨
  for (let i = 0; i < rows.length; i += PAGE_SIZE) {
    await supabase.from("company_rankings").insert(rows.slice(i, i + PAGE_SIZE));
  }

  return { companiesProcessed: companies.length, siteAverageGoodRatio };
}
