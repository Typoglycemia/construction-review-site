// lib/supabase.ts
// サーバーコンポーネント/API Route用のSupabaseクライアント初期化

import { createClient } from "@supabase/supabase-js";

// 公開データの読み取り専用クライアント(RLSに従う。匿名read)
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// サーバー専用クライアント(service_role。書き込み・PII参照が必要なAPI Route/管理画面でのみ使用)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type Company = {
  id: string;
  name: string;
  normalized_name: string;
  prefecture: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  category: string | null;
  license_information: string | null;
  corporate_number: string | null;
  status: "pending" | "published" | "merged" | "hidden";
  created_at: string;
};

export type Comment = {
  id: string;
  company_id: string;
  sentiment: "good" | "bad";
  nickname: string | null;
  body: string;
  helpful_count: number;
  status: "published" | "pending_review" | "hidden" | "deleted";
  created_at: string;
};

export type VoteSummary = {
  companyId: string;
  goodCount: number;
  badCount: number;
};

/** 業者の有効投票数を集計する(is_valid=trueのみ) */
export async function getVoteSummary(companyId: string): Promise<VoteSummary> {
  const { data, error } = await supabasePublic
    .from("votes")
    .select("vote_type")
    .eq("company_id", companyId)
    .eq("is_valid", true);

  if (error || !data) return { companyId, goodCount: 0, badCount: 0 };

  const goodCount = data.filter((v) => v.vote_type === "good").length;
  const badCount = data.filter((v) => v.vote_type === "bad").length;
  return { companyId, goodCount, badCount };
}
