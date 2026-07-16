// app/admin/(protected)/comments/history/page.tsx
export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase";
import ViewIpButton from "@/components/admin/ViewIpButton";

export default async function CommentHistoryPage({
  searchParams,
}: {
  searchParams: { identifier_hash?: string };
}) {
  const hash = searchParams.identifier_hash;
  if (!hash) return <p>識別子が指定されていません。</p>;

  const [{ data: comments }, { data: votes }, { data: anon }, { data: accessLogs }] =
    await Promise.all([
      supabaseAdmin
        .from("comments")
        .select("id, company_id, sentiment, body, status, created_at, ip_hash, companies(name)")
        .eq("anonymous_identifier_hash", hash)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("votes")
        .select("id, company_id, vote_type, is_valid, risk_score, created_at, companies(name)")
        .eq("anonymous_identifier_hash", hash)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("anonymous_users")
        .select("total_comments, total_votes, risk_score, first_seen_at, last_seen_at")
        .eq("anonymous_identifier_hash", hash)
        .maybeSingle(),
      supabaseAdmin
        .from("access_logs")
        .select("id, created_at, ip_hash")
        .in(
          "ip_hash",
          Array.from(
            new Set([
              ...((await supabaseAdmin
                .from("comments")
                .select("ip_hash")
                .eq("anonymous_identifier_hash", hash)).data ?? []
              ).map((c: any) => c.ip_hash).filter(Boolean),
            ])
          )
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const distinctCompanies = new Set([
    ...(comments ?? []).map((c: any) => c.company_id),
    ...(votes ?? []).map((v: any) => v.company_id),
  ]);

  return (
    <main className="space-y-6">
      <h1 className="text-lg font-medium">この投稿者の過去の投稿</h1>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <Stat label="総コメント数" value={anon?.total_comments ?? comments?.length ?? 0} />
        <Stat label="総投票数" value={anon?.total_votes ?? votes?.length ?? 0} />
        <Stat label="対象業者数" value={distinctCompanies.size} />
        <Stat label="リスクスコア" value={anon?.risk_score ?? "-"} />
      </div>

      {distinctCompanies.size > 5 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-300 rounded p-2">
          短期間に多数の業者へ投稿・投票しているパターンが見られます。組織的な荒らし・投票の可能性を確認してください。
        </p>
      )}

      <section>
        <h2 className="font-medium mb-2 text-sm">アクセス元IP情報(要閲覧理由の入力)</h2>
        <ul className="text-sm space-y-2">
          {(accessLogs ?? []).map((log: any) => (
            <li key={log.id} className="border rounded p-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(log.created_at).toLocaleString("ja-JP")}
              </span>
              <ViewIpButton accessLogId={log.id} />
            </li>
          ))}
          {(accessLogs ?? []).length === 0 && (
            <p className="text-xs text-gray-400">関連するアクセスログが見つかりません。</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2 text-sm">コメント履歴</h2>
        <ul className="text-sm space-y-2">
          {(comments ?? []).map((c: any) => (
            <li key={c.id} className="border rounded p-2">
              <span className="text-gray-500">{c.companies?.name}</span> / {c.sentiment} /{" "}
              {c.status} — {c.body}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2 text-sm">投票履歴</h2>
        <ul className="text-sm space-y-2">
          {(votes ?? []).map((v: any) => (
            <li key={v.id} className="border rounded p-2">
              <span className="text-gray-500">{v.companies?.name}</span> / {v.vote_type} /{" "}
              有効: {v.is_valid ? "はい" : "いいえ"} / リスク {v.risk_score}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );
}
