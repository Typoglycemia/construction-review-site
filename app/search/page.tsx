// app/search/page.tsx
import { supabasePublic } from "@/lib/supabase";
import CompanyCard from "@/components/CompanyCard";

async function searchCompanies(q: string) {
  if (!q?.trim()) return [];
  const { data } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url, category")
    .eq("status", "published")
    .or(
      `name.ilike.%${q}%,normalized_name.ilike.%${q}%,prefecture.ilike.%${q}%,city.ilike.%${q}%`
    )
    .limit(30);
  return data ?? [];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";
  const results = q ? await searchCompanies(q) : [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="会社名・屋号・地域から検索"
          className="w-full border rounded-lg px-4 py-3 text-lg"
        />
      </form>

      {q && (
        <p className="text-sm text-gray-500 mb-4">
          「{q}」の検索結果 {results.length}件
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.map((c) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>

      {q && results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">該当する業者が見つかりませんでした。</p>
          <a href="/companies/new" className="text-blue-600 underline">
            この業者を新しく登録する
          </a>
        </div>
      )}
    </main>
  );
}
