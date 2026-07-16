// lib/ratelimit.ts
// Upstash Redisを使ったレートリミット。
// 投票・コメント・登録申請など、匿名で連打されると困るエンドポイントに適用する。
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 投票: 同一IPから1分間に5回まで
export const voteRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:vote",
});

// コメント: 同一IPから10分間に5回まで
export const commentRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "ratelimit:comment",
});

// 業者登録申請: 同一IPから1時間に3回まで
export const submissionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:submission",
});

// お問い合わせ等の汎用フォーム: 同一IPから1時間に10回まで
export const generalFormRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "ratelimit:general",
});
