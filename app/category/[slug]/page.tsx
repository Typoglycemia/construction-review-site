// app/category/[slug]/page.tsx
import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase";
import CompanyCard from "@/components/CompanyCard";
import { buildCategoryPageTitle } from "@/lib/seo";

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
}: {
  params: { slug: string };
}) {
  const label = CATEGORY_LABELS[params.slug] ?? params.slug;
  const { data: companies } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url, category")
    .eq("status", "published")
    .eq("category", label)
    .limit(60);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">{label}業者の評判・口コミ一覧</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(companies ?? []).map((c) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>
      {(companies ?? []).length === 0 && (
        <p className="text-sm text-gray-500">まだ登録されている業者がありません。</p>
      )}
    </main>
  );
}
