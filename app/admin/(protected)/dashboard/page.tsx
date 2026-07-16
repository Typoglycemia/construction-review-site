// app/admin/dashboard/page.tsx
import { supabaseAdmin } from "@/lib/supabase";

async function getCounts() {
  const [companies, pendingSubmissions, pendingComments, pendingReports, mergeCandidates] =
    await Promise.all([
      supabaseAdmin.from("companies").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("company_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin
        .from("company_merge_candidates")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  return {
    companies: companies.count ?? 0,
    pendingSubmissions: pendingSubmissions.count ?? 0,
    pendingComments: pendingComments.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
    mergeCandidates: mergeCandidates.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const counts = await getCounts();

  return (
    <main>
      <h1 className="text-lg font-medium mb-4">ダッシュボード</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="登録業者数" value={counts.companies} href="/admin/companies" />
        <Stat
          label="新規登録申請(未処理)"
          value={counts.pendingSubmissions}
          href="/admin/submissions"
        />
        <Stat
          label="コメント確認待ち"
          value={counts.pendingComments}
          href="/admin/comments"
        />
        <Stat label="通報(未対応)" value={counts.pendingReports} href="/admin/reports" />
        <Stat
          label="重複候補(未処理)"
          value={counts.mergeCandidates}
          href="/admin/companies/duplicates"
        />
      </div>
    </main>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a href={href} className="border rounded-lg p-4 block hover:bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-medium">{value}</p>
    </a>
  );
}
