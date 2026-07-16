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

const MEDAL_COLORS: Record<number, string> = {
  1: "bg-[#D4AF37] text-white",
  2: "bg-[#A8A8A8] text-white",
  3: "bg-[#B08D57] text-white",
};

const CONTRACTOR_LABELS: Record<string, string> = {
  prime: "元請け",
  sub: "下請け",
  both: "両方",
  unknown: "不明",
};

export default async function RankingPage({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams: { contractor?: string };
}) {
  if (params.type !== "good" && params.type !== "bad") notFound();
  const type = params.type as "good" | "bad";
  const contractorFilter = searchParams.contractor ?? "all";

  let query = supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url, category, contractor_type")
    .eq("status", "published")
    .limit(1000);

  if (contractorFilter === "prime") {
    query = query.in("contractor_type", ["prime", "both"]);
  } else if (contractorFilter === "sub") {
    query = query.in("contractor_type", ["sub", "both"]);
  } else if (contractorFilter === "both") {
    query = query.eq("contractor_type", "both");
  }

  const { data: companies } = await query;

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

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "prime", label: "元請け" },
    { key: "sub", label: "下請け" },
    { key: "both", label: "両方" },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-2 flex items-center gap-2">
        {type === "good" ? (
          <svg width="36" height="36" viewBox="0 0 80 70" aria-hidden="true">
            <g>
              <path d="M40 10 L45 30 L65 30 L48 42 L55 62 L40 50 L25 62 L32 42 L15 30 L35 30 Z" fill="#1A56DB"/>
              <rect x="30" y="62" width="20" height="8" fill="#1A56DB"/>
              <path d="M10 25 Q0 25 0 15 Q0 5 12 8" fill="none" stroke="#1A56DB" strokeWidth="3"/>
              <path d="M70 25 Q80 25 80 15 Q80 5 68 8" fill="none" stroke="#1A56DB" strokeWidth="3"/>
            </g>
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 80 70" aria-hidden="true">
            <g>
              <path d="M15 40 Q15 20 40 20 Q65 20 65 40 L65 42 L15 42 Z" fill="#8A3324"/>
              <line x1="25" y1="45" x2="20" y2="60" stroke="#8A3324" strokeWidth="4" strokeLinecap="round"/>
              <line x1="40" y1="45" x2="40" y2="62" stroke="#8A3324" strokeWidth="4" strokeLinecap="round"/>
              <line x1="55" y1="45" x2="60" y2="60" stroke="#8A3324" strokeWidth="4" strokeLinecap="round"/>
              <path d="M30 10 L40 0 L50 10" fill="none" stroke="#C8A63A" strokeWidth="3" strokeLinecap="round"/>
            </g>
          </svg>
        )}
        {type === "good" ? "良い業者ランキング" : "悪い業者ランキング"}
      </h1>

      <div className="flex gap-2 mb-4 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/ranking/${type}${tab.key === "all" ? "" : `?contractor=${tab.key}`}`}
            className={
              "px-3 py-1.5 border-2 " +
              (contractorFilter === tab.key
                ? "border-steel text-steel font-bold"
                : "border-ink/10 text-ink/60")
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <p className="text-sm text-ink/50 mb-4">
        {ranked.length}社中、上位{Math.min(ranked.length, 100)}社を表示
      </p>
      <ol className="space-y-3">
        {ranked.map((r, i) => {
          const company = companies!.find((c) => c.id === r.companyId)!;
          const rank = i + 1;
          const pct = Math.round((type === "good" ? r.goodScore : r.badScore) * 100);
          return (
            <li key={r.companyId}>
              <Link
                href={`/companies/${r.companyId}`}
                className="flex items-center gap-3 border-2 border-ink/10 hover:border-steel transition p-3"
              >
                <span
                  className={
                    "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm " +
                    (MEDAL_COLORS[rank] ?? "bg-ink/10 text-ink")
                  }
                >
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{company.name}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <span className="text-xs bg-steel/10 text-steel px-2 py-0.5 rounded-full">
                      {company.prefecture}
                    </span>
                    {company.category && (
                      <span className="text-xs bg-ink/10 text-ink/70 px-2 py-0.5 rounded-full">
                        {company.category}
                      </span>
                    )}
                    {company.contractor_type && company.contractor_type !== "unknown" && (
                      <span className="text-xs bg-caution/20 text-ink/70 px-2 py-0.5 rounded-full">
                        {CONTRACTOR_LABELS[company.contractor_type]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-mono font-bold text-lg">{pct}%</p>
                  <p className="text-xs text-ink/40">{r.totalVotes}票</p>
                </div>
                <div className="flex-shrink-0 w-16 h-16 bg-paper border border-ink/10 flex items-center justify-center overflow-hidden">
                  {company.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={company.logo_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-ink/30">No Image</span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-ink/40 mt-6">{RANKING_DISCLAIMER}</p>
    </main>
  );
}
