// app/prefecture/[code]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabase";
import CompanyCard from "@/components/CompanyCard";
import { buildPrefecturePageTitle } from "@/lib/seo";

const PAGE_SIZE = 50;

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
  searchParams,
}: {
  params: { code: string };
  searchParams: { page?: string };
}) {
  const prefecture = decodeURIComponent(params.code);
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: companies, count } = await supabasePublic
    .from("companies")
    .select("id, name, prefecture, city, logo_url, category", { count: "exact" })
    .eq("status", "published")
    .eq("prefecture", prefecture)
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">
        {prefecture}の建設会社・工務店・リフォーム会社
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
          <Link href={`/prefecture/${params.code}?page=${page - 1}`} className="text-blue-600">
            前へ
          </Link>
        )}
        <span>
          {page} / {totalPages} ページ
        </span>
        {page < totalPages && (
          <Link href={`/prefecture/${params.code}?page=${page + 1}`} className="text-blue-600">
            次へ
          </Link>
        )}
      </div>
    </main>
  );
}
