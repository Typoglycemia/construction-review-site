// app/admin/(protected)/takedowns/page.tsx
import { supabaseAdmin } from "@/lib/supabase";

export default async function TakedownsPage() {
  const { data: requests } = await supabaseAdmin
    .from("takedown_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main>
      <h1 className="text-lg font-medium mb-4">削除・権利侵害申請</h1>
      <div className="space-y-3">
        {(requests ?? []).map((r: any) => (
          <div key={r.id} className="border rounded p-3 text-sm whitespace-pre-wrap">
            <p className="text-xs text-gray-500 mb-1">
              {r.request_type} ・ {new Date(r.created_at).toLocaleString("ja-JP")}
            </p>
            <p>{r.detail}</p>
          </div>
        ))}
        {(requests ?? []).length === 0 && (
          <p className="text-sm text-gray-500">未対応の申請はありません。</p>
        )}
      </div>
    </main>
  );
}
