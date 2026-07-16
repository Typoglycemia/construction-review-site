// app/admin/(protected)/audit-logs/page.tsx
import { supabaseAdmin } from "@/lib/supabase";

export default async function AuditLogsPage() {
  const [{ data: adminActions }, { data: accessLogs }] = await Promise.all([
    supabaseAdmin
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("admin_access_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-lg font-medium mb-4">管理者操作履歴</h1>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">操作</th>
              <th>対象</th>
              <th>日時</th>
            </tr>
          </thead>
          <tbody>
            {(adminActions ?? []).map((a: any) => (
              <tr key={a.id} className="border-b">
                <td className="py-2">{a.action_type}</td>
                <td>
                  {a.target_type} / {a.target_id}
                </td>
                <td className="text-xs text-gray-500">
                  {new Date(a.created_at).toLocaleString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">個人情報閲覧ログ</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">閲覧対象</th>
              <th>理由</th>
              <th>日時</th>
            </tr>
          </thead>
          <tbody>
            {(accessLogs ?? []).map((a: any) => (
              <tr key={a.id} className="border-b">
                <td className="py-2">
                  {a.viewed_target_type} / {a.viewed_target_id}
                </td>
                <td>{a.reason ?? "-"}</td>
                <td className="text-xs text-gray-500">
                  {new Date(a.created_at).toLocaleString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
