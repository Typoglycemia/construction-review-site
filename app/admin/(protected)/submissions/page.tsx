// app/admin/(protected)/submissions/page.tsx
export const dynamic = "force-dynamic";
import { supabaseAdmin } from "@/lib/supabase";

export default async function SubmissionsPage() {
  const [{ data: submissions }, { data: editRequests }] = await Promise.all([
    supabaseAdmin
      .from("company_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("company_edit_requests")
      .select("*, companies(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-lg font-medium mb-4">新規登録申請</h1>
        <div className="space-y-2">
          {(submissions ?? []).map((s: any) => (
            <div key={s.id} className="border rounded p-3 text-sm">
              <p className="font-medium">{s.submitted_data?.name}</p>
              <p className="text-gray-500">
                {s.submitted_data?.prefecture}
                {s.submitted_data?.city} ・ {s.submitted_data?.category}
              </p>
              {s.duplicate_candidate_id && (
                <p className="text-amber-700 text-xs mt-1">
                  類似する既存業者あり(要確認)
                </p>
              )}
              <div className="flex gap-3 mt-2">
                <form action={`/api/admin/submissions/${s.id}/approve`} method="post">
                  <button className="text-blue-600 text-xs">承認して掲載</button>
                </form>
                <form action={`/api/admin/submissions/${s.id}/reject`} method="post">
                  <button className="text-red-600 text-xs">却下</button>
                </form>
              </div>
            </div>
          ))}
          {(submissions ?? []).length === 0 && (
            <p className="text-sm text-gray-500">未処理の新規登録申請はありません。</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">情報修正依頼</h2>
        <div className="space-y-2">
          {(editRequests ?? []).map((r: any) => (
            <div key={r.id} className="border rounded p-3 text-sm">
              <p className="font-medium">{r.companies?.name}</p>
              <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                {JSON.stringify(r.proposed_changes, null, 2)}
              </pre>
              <div className="flex gap-3 mt-2">
                <form action={`/api/admin/edit-requests/${r.id}/approve`} method="post">
                  <button className="text-blue-600 text-xs">承認して反映</button>
                </form>
                <form action={`/api/admin/edit-requests/${r.id}/reject`} method="post">
                  <button className="text-red-600 text-xs">却下</button>
                </form>
              </div>
            </div>
          ))}
          {(editRequests ?? []).length === 0 && (
            <p className="text-sm text-gray-500">未処理の修正依頼はありません。</p>
          )}
        </div>
      </section>
    </main>
  );
}
