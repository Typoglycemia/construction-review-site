/**
 * lib/ranking.ts
 * 良い/悪い業者ランキングのスコア計算(ベイズ平均)
 *
 * 単純な「良い票 / 総投票数」だと、少数投票の業者が極端な順位になってしまうため、
 * サイト全体の平均得票率(priorMean)と最低投票数の重み(priorWeight)を使って補正する。
 */

export type VoteCounts = {
  goodCount: number;
  badCount: number;
};

export type RankingOptions = {
  /** サイト全体の平均「良い」割合 (0.0〜1.0)。事前に全業者の集計から算出しておく */
  siteAverageGoodRatio: number;
  /** 最低投票数の重み。大きいほど、投票数が少ない業者はサイト平均に近づく */
  priorWeight: number;
};

const DEFAULT_OPTIONS: RankingOptions = {
  siteAverageGoodRatio: 0.5,
  priorWeight: 50,
};

/**
 * ベイズ平均による「良い」スコアを計算する。
 * score = (priorMean * priorWeight + goodCount) / (priorWeight + totalVotes)
 */
export function calculateGoodScore(
  counts: VoteCounts,
  options: Partial<RankingOptions> = {}
): number {
  const { siteAverageGoodRatio, priorWeight } = { ...DEFAULT_OPTIONS, ...options };
  const total = counts.goodCount + counts.badCount;
  if (total === 0) return siteAverageGoodRatio;

  return (
    (siteAverageGoodRatio * priorWeight + counts.goodCount) /
    (priorWeight + total)
  );
}

/** 悪い業者ランキング用: 「悪い」の割合をベイズ平均で補正 */
export function calculateBadScore(
  counts: VoteCounts,
  options: Partial<RankingOptions> = {}
): number {
  const { siteAverageGoodRatio, priorWeight } = { ...DEFAULT_OPTIONS, ...options };
  const siteAverageBadRatio = 1 - siteAverageGoodRatio;
  const total = counts.goodCount + counts.badCount;
  if (total === 0) return siteAverageBadRatio;

  return (
    (siteAverageBadRatio * priorWeight + counts.badCount) /
    (priorWeight + total)
  );
}

/**
 * サイト全体の平均得票率を計算する(バッチ処理で定期的に再計算し、
 * ranking_config テーブル等にキャッシュしておく想定)
 */
export function calculateSiteAverageGoodRatio(allCompanies: VoteCounts[]): number {
  let totalGood = 0;
  let totalVotes = 0;
  for (const c of allCompanies) {
    totalGood += c.goodCount;
    totalVotes += c.badCount + c.goodCount;
  }
  if (totalVotes === 0) return 0.5;
  return totalGood / totalVotes;
}

export type CompanyRankingInput = {
  companyId: string;
  counts: VoteCounts;
};

export type CompanyRankingResult = {
  companyId: string;
  goodScore: number;
  badScore: number;
  totalVotes: number;
};

/**
 * 業者一覧からランキングを生成するユーティリティ。
 * ※ counts は事前に `is_valid = true` の投票のみで集計しておくこと。
 */
export function buildRanking(
  companies: CompanyRankingInput[],
  type: "good" | "bad",
  options: Partial<RankingOptions> = {},
  minVotes = 5
): CompanyRankingResult[] {
  const siteAverageGoodRatio =
    options.siteAverageGoodRatio ??
    calculateSiteAverageGoodRatio(companies.map((c) => c.counts));

  const resolvedOptions: RankingOptions = { ...DEFAULT_OPTIONS, ...options, siteAverageGoodRatio };

  const results = companies
    .map((c) => {
      const totalVotes = c.counts.goodCount + c.counts.badCount;
      return {
        companyId: c.companyId,
        goodScore: calculateGoodScore(c.counts, resolvedOptions),
        badScore: calculateBadScore(c.counts, resolvedOptions),
        totalVotes,
      };
    })
    // 最低投票数に満たない業者はランキング対象から除外(誤って1位になるのを防止)
    .filter((r) => r.totalVotes >= minVotes);

  return type === "good"
    ? results.sort((a, b) => b.goodScore - a.goodScore)
    : results.sort((a, b) => b.badScore - a.badScore);
}
