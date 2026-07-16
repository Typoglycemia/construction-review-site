// app/admin/votes/page.tsx
// 不正投票の検知キュー(risk_score降順)。管理者が個別にis_validを反転できる。

import { supabaseAdmin } from "@/lib/supabase";
import VoteInvalidateAction from "@/components/admin/VoteInvalidateAction";

export default async function AdminVotesPage() {
  const { data: votes } = await supabaseAdmin
    .from("votes")
    .select("id, company_id, vote_type, is_valid, invalid_reason, risk_score, created_at, companies(name)")
    .gt("risk_score", 0)
    .order("risk_score", { ascending: false })
    .limit(100);

  return (
    <main>
      <h1 className="text-lg font-medium mb-4">不正投票検知キュー</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">業者</th>
            <th>種別</th>
            <th>有効</th>
            <th>理由</th>
            <th>リスク</th>
            <th>日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {(votes ?? []).map((v: any) => (
            <tr key={v.id} className="border-b">
              <td className="py-2">{v.companies?.name}</td>
              <td>{v.vote_type === "good" ? "良い" : "悪い"}</td>
              <td>{v.is_valid ? "有効" : "無効"}</td>
              <td className="text-xs text-gray-500">{v.invalid_reason ?? "-"}</td>
              <td>{v.risk_score}</td>
              <td className="text-xs text-gray-500">
                {new Date(v.created_at).toLocaleString("ja-JP")}
              </td>
              <td>
                <VoteInvalidateAction voteId={v.id} currentlyValid={v.is_valid} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
