// app/admin/(protected)/reports/page.tsx
import { supabaseAdmin } from "@/lib/supabase";

const REASON_LABELS: Record<string, string> = {
  false_info: "虚偽情報の疑い",
  defamation: "誹謗中傷",
  personal_info: "個人情報",
  threat: "脅迫",
  discrimination: "差別的表現",
  impersonation: "なりすまし",
  spam: "スパム",
  irrelevant: "無関係な投稿",
  other: "その他",
};

export default async function ReportsPage() {
  const { data: reports } = await supabaseAdmin
    .from("reports")
    .select("id, reason, detail, status, created_at, comments(id, body, company_id, companies(name))")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main>
      <h1 className="text-lg font-medium mb-4">通報一覧</h1>
      <div className="space-y-3">
        {(reports ?? []).map((r: any) => (
          <div key={r.id} className="border rounded p-3 text-sm">
            <p className="text-xs text-gray-500 mb-1">
              {REASON_LABELS[r.reason] ?? r.reason} ・{" "}
              {new Date(r.created_at).toLocaleString("ja-JP")}
            </p>
            <p className="font-medium">{r.comments?.companies?.name}</p>
            <p className="mb-2">{r.comments?.body}</p>
            {r.detail && <p className="text-xs text-gray-500">詳細: {r.detail}</p>}
            <a
              href={`/admin/comments?highlight=${r.comments?.id}`}
              className="text-blue-600 text-xs"
            >
              コメント管理で確認する
            </a>
          </div>
        ))}
        {(reports ?? []).length === 0 && (
          <p className="text-sm text-gray-500">未対応の通報はありません。</p>
        )}
      </div>
    </main>
  );
}
