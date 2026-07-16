// app/admin/(protected)/companies/page.tsx
export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import CompanyStatusActions from "@/components/admin/CompanyStatusActions";

export default async function AdminCompaniesPage() {
  const { data: companies } = await supabaseAdmin
    .from("companies")
    .select("id, name, prefecture, city, category, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">業者管理</h1>
        <Link href="/admin/companies/duplicates" className="text-sm text-blue-600">
          重複業者候補を見る
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">会社名</th>
            <th>所在地</th>
            <th>業種</th>
            <th>状態</th>
            <th>登録日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {(companies ?? []).map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">
                <a href={`/companies/${c.id}`} className="text-blue-600" target="_blank">
                  {c.name}
                </a>
              </td>
              <td>
                {c.prefecture}
                {c.city}
              </td>
              <td>{c.category ?? "-"}</td>
              <td>{c.status}</td>
              <td className="text-xs text-gray-500">
                {new Date(c.created_at).toLocaleDateString("ja-JP")}
              </td>
              <td>
                <CompanyStatusActions companyId={c.id} currentStatus={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(companies ?? []).length === 0 && (
        <p className="text-sm text-gray-500">まだ登録されている業者がありません。</p>
      )}
    </main>
  );
}
