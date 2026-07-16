/**
 * lib/moderation.ts
 * 投票の不正検知・コメントの荒らし対策(リスクスコア計算)
 *
 * risk_score は 0〜100 のスケールとし、しきい値を超えたら
 * - votes: is_valid = false としてランキング集計から自動除外
 * - comments: status = 'pending_review' として管理者キューに回す
 */

export type VoteRiskInput = {
  /** 同一識別子が同じ業者に最後に投票した日時(なければ null) */
  lastVoteAtForCompany: Date | null;
  /** 同一識別子が直近1分間に行った投票の総数(業者問わず) */
  votesInLastMinute: number;
  /** 同一IPハッシュから直近1時間に投票された、異なる識別子の数 */
  distinctIdentifiersFromIpInLastHour: number;
  /** Turnstile等のBot判定結果 */
  botScoreSuspicious: boolean;
};

const REVOTE_COOLDOWN_DAYS = 90;

export function calculateVoteRiskScore(input: VoteRiskInput): {
  riskScore: number;
  isValid: boolean;
  invalidReason: string | null;
} {
  let score = 0;
  const reasons: string[] = [];

  if (input.lastVoteAtForCompany) {
    const daysSince =
      (Date.now() - input.lastVoteAtForCompany.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < REVOTE_COOLDOWN_DAYS) {
      score += 100;
      reasons.push("revote_cooldown_violation");
    }
  }

  if (input.votesInLastMinute > 3) {
    score += 40;
    reasons.push("high_frequency_voting");
  }

  if (input.distinctIdentifiersFromIpInLastHour > 5) {
    score += 30;
    reasons.push("shared_ip_multiple_identifiers");
  }

  if (input.botScoreSuspicious) {
    score += 50;
    reasons.push("bot_suspected");
  }

  const riskScore = Math.min(score, 100);
  const isValid = riskScore < 50;

  return {
    riskScore,
    isValid,
    invalidReason: isValid ? null : reasons.join(","),
  };
}

export type CommentRiskInput = {
  body: string;
  /** 同一識別子が直近10分間に投稿したコメント数 */
  commentsInLast10Min: number;
  /** 同一識別子が過去に投稿した異なる業者の数(短期間で急増している場合は荒らしの疑い) */
  distinctCompaniesCommentedRecently: number;
};

// 個人情報らしきパターン(電話番号・郵便番号など)の簡易検出。
// 実運用ではより精緻な正規表現・NGワード辞書を別途整備すること。
const PHONE_PATTERN = /0\d{1,4}-?\d{1,4}-?\d{3,4}/;
const POSTAL_PATTERN = /\d{3}-?\d{4}/;
const THREAT_KEYWORDS = ["殺す", "burn down", "火をつける"];

export function calculateCommentRiskScore(input: CommentRiskInput): {
  riskScore: number;
  status: "published" | "pending_review";
  flags: string[];
} {
  let score = 0;
  const flags: string[] = [];

  if (PHONE_PATTERN.test(input.body)) {
    score += 60;
    flags.push("possible_phone_number");
  }
  if (POSTAL_PATTERN.test(input.body)) {
    score += 20;
    flags.push("possible_postal_code");
  }
  if (THREAT_KEYWORDS.some((kw) => input.body.includes(kw))) {
    score += 100;
    flags.push("possible_threat");
  }
  if (input.commentsInLast10Min > 5) {
    score += 40;
    flags.push("high_frequency_posting");
  }
  if (input.distinctCompaniesCommentedRecently > 5) {
    score += 30;
    flags.push("multi_company_spam_pattern");
  }

  const riskScore = Math.min(score, 100);
  const status = riskScore >= 50 ? "pending_review" : "published";

  return { riskScore, status, flags };
}
