// app/prefecture/[code]/page.tsx
import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase";
import CompanyCard from "@/components/CompanyCard";
import { buildPrefecturePageTitle } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const prefecture = decodeURIComponent(params.code);
  return { title: buildPrefecturePageTitle(prefecture) };
}

export default async function PrefectureDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const prefecture = decodeURIComponent(params.code);
  const { data: companies } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url, category")
    .eq("status", "published")
    .eq("prefecture", prefecture)
    .limit(60);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">{prefecture}の建設会社・工務店・リフォーム会社</h1>
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
