// app/admin/(protected)/companies/page.tsx
export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import CompanyStatusActions from "@/components/admin/CompanyStatusActions";

const PAGE_SIZE = 100;

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; prefecture?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const q = searchParams.q ?? "";
  const prefecture = searchParams.prefecture ?? "";

  let query = supabaseAdmin
    .from("companies")
    .select("id, name, prefecture, city, category, status, created_at", { count: "exact" });

  if (q) {
    query = query.or(`name.ilike.%${q}%,normalized_name.ilike.%${q}%`);
  }
  if (prefecture) {
    query = query.eq("prefecture", prefecture);
  }

  const { data: companies, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (prefecture) params.set("prefecture", prefecture);
    params.set("page", String(p));
    return `/admin/companies?${params.toString()}`;
  }

  return (
    <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">
          業者管理 <span className="text-sm text-gray-500">(全{count ?? 0}件)</span>
        </h1>
        <Link href="/admin/companies/duplicates" className="text-sm text-blue-600">
          重複業者候補を見る
        </Link>
      </div>

      <form className="flex gap-2 mb-4 text-sm" action="/admin/companies">
        <input
          name="q"
          defaultValue={q}
          placeholder="会社名で検索"
          className="border rounded px-3 py-2 flex-1"
        />
        <input
          name="prefecture"
          defaultValue={prefecture}
          placeholder="都道府県(例: 東京都)"
          className="border rounded px-3 py-2 w-48"
        />
        <button className="bg-black text-white px-4 py-2 rounded">検索</button>
        {(q || prefecture) && (
          <a href="/admin/companies" className="px-4 py-2 text-gray-500">
            クリア
          </a>
        )}
      </form>

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
                <div className="flex flex-col gap-1">
                  <a href={`/admin/companies/${c.id}/edit`} className="text-xs text-blue-600">
                    編集
                  </a>
                  <CompanyStatusActions companyId={c.id} currentStatus={c.status} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(companies ?? []).length === 0 && (
        <p className="text-sm text-gray-500">該当する業者が見つかりません。</p>
      )}

      <div className="flex items-center justify-center gap-4 mt-6 text-sm">
        {page > 1 && (
          <Link href={pageHref(page - 1)} className="text-blue-600">
            前へ
          </Link>
        )}
        <span>
          {page} / {totalPages} ページ
        </span>
        {page < totalPages && (
          <Link href={pageHref(page + 1)} className="text-blue-600">
            次へ
          </Link>
        )}
      </div>
    </main>
  );
}
