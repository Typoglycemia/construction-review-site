// app/page.tsx
import Link from "next/link";
import { supabasePublic } from "@/lib/supabase";
import { buildRanking } from "@/lib/ranking";
import CompanyCard from "@/components/CompanyCard";
import VoteBadge from "@/components/VoteBadge";

export const revalidate = 60; // 1分ごとにISR再生成

async function getTrendingComments() {
  const { data } = await supabasePublic
    .from("comments")
    .select("id, company_id, sentiment, body, created_at, companies!inner(name, logo_url, status)")
    .eq("status", "published")
    .eq("companies.status", "published")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

async function getRecentlyAddedCompanies() {
  const { data } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url, category, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

async function getTopRanking(type: "good" | "bad") {
  // 簡易実装: 全業者+投票を取得して集計(件数が多い場合はDB側の集計ビュー/バッチ結果を使うこと。
  // lib/ranking-batch.ts のバッチ処理結果をキャッシュテーブルから読むのが本来の実装)
  const { data: companies } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url")
    .eq("status", "published")
    .limit(500);

  if (!companies) return [];

  const { data: votes } = await supabasePublic
    .from("votes")
    .select("company_id, vote_type")
    .eq("is_valid", true)
    .in("company_id", companies.map((c) => c.id));

  const counts = new Map<string, { good: number; bad: number }>();
  for (const v of votes ?? []) {
    const c = counts.get(v.company_id) ?? { good: 0, bad: 0 };
    if (v.vote_type === "good") c.good++;
    else c.bad++;
    counts.set(v.company_id, c);
  }

  const ranked = buildRanking(
    companies.map((c) => ({
      companyId: c.id,
      counts: { goodCount: counts.get(c.id)?.good ?? 0, badCount: counts.get(c.id)?.bad ?? 0 },
    })),
    type
  );

  return ranked.slice(0, 5).map((r) => ({
    ...companies.find((c) => c.id === r.companyId)!,
    ...r,
  }));
}

export default async function TopPage() {
  const [comments, recentCompanies, goodRanking, badRanking] = await Promise.all([
    getTrendingComments(),
    getRecentlyAddedCompanies(),
    getTopRanking("good"),
    getTopRanking("bad"),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* ファーストビュー */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">建設会社、良い？悪い？</h1>
        <p className="text-gray-600">
          全国の建設会社・工務店・リフォーム会社を匿名投票とコメントでチェック。
        </p>
        <form action="/search" className="max-w-xl mx-auto">
          <input
            name="q"
            placeholder="会社名・屋号・地域から検索"
            className="w-full border rounded-lg px-4 py-3 text-lg"
          />
        </form>
      </section>

      {/* ランキング(良い/悪い) */}
      <section className="grid md:grid-cols-2 gap-6">
        <RankingBlock title="良い業者ランキング" type="good" items={goodRanking} />
        <RankingBlock title="悪い業者ランキング" type="bad" items={badRanking} />
      </section>

      {/* 新着コメント */}
      <section>
        <h2 className="text-xl font-medium mb-4">新着コメント</h2>
        <div className="space-y-3">
          {comments.map((c: any) => (
            <Link
              key={c.id}
              href={`/companies/${c.company_id}`}
              className="block border rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{c.companies?.name}</span>
                <VoteBadge sentiment={c.sentiment} />
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{c.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 新しく登録された業者 */}
      <section>
        <h2 className="text-xl font-medium mb-4">新しく登録された業者</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentCompanies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      </section>

      {/* 業者追加CTA */}
      <section className="text-center border rounded-xl p-8 bg-gray-50">
        <h2 className="text-xl font-medium mb-2">探している業者がありませんか？</h2>
        <p className="text-gray-600 mb-4">
          まだ登録されていない建設会社・工務店・リフォーム会社は追加できます。
        </p>
        <Link
          href="/companies/new"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg"
        >
          業者を新しく追加する
        </Link>
      </section>
    </main>
  );
}

function RankingBlock({
  title,
  type,
  items,
}: {
  title: string;
  type: "good" | "bad";
  items: any[];
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">{title}</h2>
        <Link href={`/ranking/${type}`} className="text-sm text-gray-500">
          もっと見る
        </Link>
      </div>
      <ol className="space-y-2">
        {items.map((item, i) => {
          const total = item.totalVotes;
          const pct =
            total > 0
              ? Math.round((type === "good" ? item.goodScore : item.badScore) * 100)
              : null;
          return (
            <li key={item.id} className="flex items-center gap-3">
              <span className="w-5 text-gray-400">{i + 1}</span>
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-sm text-gray-500">
                {pct !== null ? `${pct}%` : "-"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
