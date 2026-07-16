// app/category/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabase";
import CompanyCard from "@/components/CompanyCard";
import { buildCategoryPageTitle } from "@/lib/seo";

const PAGE_SIZE = 50;

const CATEGORY_LABELS: Record<string, string> = {
  general: "総合建設",
  builder: "工務店",
  reform: "リフォーム",
  interior: "内装",
  carpenter: "大工",
  wallpaper: "クロス",
  paint: "塗装",
  electric: "電気工事",
  facility: "設備工事",
  plumbing: "水道",
  roof: "屋根",
  waterproof: "防水",
  demolition: "解体",
  exterior: "外構",
  cleaning: "ハウスクリーニング",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const label = CATEGORY_LABELS[params.slug] ?? params.slug;
  return { title: buildCategoryPageTitle(label) };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const label = CATEGORY_LABELS[params.slug] ?? params.slug;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: companies, count } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url, category", { count: "exact" })
    .eq("status", "published")
    .eq("category", label)
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">
        {label}業者の評判・口コミ一覧
        <span className="text-sm text-gray-500 ml-2">(全{count ?? 0}件)</span>
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(companies ?? []).map((c) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>
      {(companies ?? []).length === 0 && (
        <p className="text-sm text-gray-500">まだ登録されている業者がありません。</p>
      )}

      <div className="flex items-center justify-center gap-4 mt-6 text-sm">
        {page > 1 && (
          <Link href={`/category/${params.slug}?page=${page - 1}`} className="text-blue-600">
            前へ
          </Link>
        )}
        <span>
          {page} / {totalPages} ページ
        </span>
        {page < totalPages && (
          <Link href={`/category/${params.slug}?page=${page + 1}`} className="text-blue-600">
            次へ
          </Link>
        )}
      </div>
    </main>
  );
}
