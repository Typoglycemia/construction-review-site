// app/admin/comments/page.tsx
// コメント一覧・モデレーション。moderator以上のみアクセス(layout.tsxで権限チェック済み前提)。

import { supabaseAdmin } from "@/lib/supabase";
import ModerationActions from "@/components/admin/ModerationActions";

async function getPendingComments() {
  const { data } = await supabaseAdmin
    .from("comments")
    .select(
      "id, company_id, sentiment, body, status, risk_score, anonymous_identifier_hash, created_at, companies(name)"
    )
    .in("status", ["pending_review", "published"])
    .order("risk_score", { ascending: false })
    .limit(100);
  return data ?? [];
}

export default async function AdminCommentsPage() {
  const comments = await getPendingComments();

  return (
    <main>
      <h1 className="text-lg font-medium mb-4">コメント管理</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">業者</th>
            <th>内容</th>
            <th>状態</th>
            <th>リスク</th>
            <th>投稿日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c: any) => (
            <tr key={c.id} className="border-b align-top">
              <td className="py-2 pr-2">{c.companies?.name}</td>
              <td className="pr-2 max-w-xs truncate">{c.body}</td>
              <td>{c.status}</td>
              <td>{c.risk_score}</td>
              <td className="text-xs text-gray-500">
                {new Date(c.created_at).toLocaleString("ja-JP")}
              </td>
              <td>
                <ModerationActions commentId={c.id} />
                <a
                  href={`/admin/comments/history?identifier_hash=${c.anonymous_identifier_hash}`}
                  className="block text-xs text-blue-600 mt-1"
                >
                  この投稿者の過去の投稿を見る
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
