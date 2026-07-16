// app/companies/[id]/page.tsx
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabasePublic, getVoteSummary } from "@/lib/supabase";
import {
  buildCompanyPageTitle,
  buildCompanyPageDescription,
  buildCompanyJsonLd,
  RANKING_DISCLAIMER,
} from "@/lib/seo";
import VotePanel from "@/components/VotePanel";
import CommentSection from "@/components/CommentSection";

async function getCompany(id: string) {
  const { data } = await supabasePublic
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

async function getComments(companyId: string) {
  const { data } = await supabasePublic
    .from("comments")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const company = await getCompany(params.id);
  if (!company) return {};
  const votes = await getVoteSummary(company.id);
  return {
    title: buildCompanyPageTitle(company),
    description: buildCompanyPageDescription(company, votes),
    alternates: { canonical: `/companies/${company.id}` },
    openGraph: {
      title: buildCompanyPageTitle(company),
      description: buildCompanyPageDescription(company, votes),
      images: company.logo_url ? [company.logo_url] : undefined,
    },
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await getCompany(params.id);
  if (!company) notFound();

  const [votes, comments] = await Promise.all([
    getVoteSummary(company.id),
    getComments(company.id),
  ]);

  const jsonLd = buildCompanyJsonLd(company, votes);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-50 rounded flex items-center justify-center text-xs text-gray-400">
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo_url} alt="" className="object-contain w-full h-full" />
          ) : (
            "No Image"
          )}
        </div>
        <div>
          <h1 className="text-3xl font-black">{company.name}</h1>
          <p className="text-base text-ink/60 mt-1">
            {company.prefecture}
            {company.city} ・ {company.category ?? "業種未設定"}
          </p>
        </div>
      </header>

      <VotePanel companyId={company.id} initialVotes={votes} />

      <section className="text-sm border-t pt-4 space-y-1 text-gray-600">
        {company.address && <p>所在地: {company.address}</p>}
        {company.phone && <p>電話番号: {company.phone}</p>}
        {company.website_url && (
          <p>
            公式サイト:{" "}
            <a href={company.website_url} className="text-blue-600" target="_blank">
              {company.website_url}
            </a>
          </p>
        )}
        {company.corporate_number && <p>法人番号: {company.corporate_number}</p>}
        {company.license_information && <p>建設業許可: {company.license_information}</p>}
        <a href={`/companies/${company.id}/edit-request`} className="inline-block text-blue-600 mt-2">
          情報の修正を依頼する
        </a>
      </section>

      <CommentSection companyId={company.id} initialComments={comments} />

      <p className="text-xs text-gray-400 border-t pt-4">{RANKING_DISCLAIMER}</p>
      <a href="/takedown-request" className="text-xs text-gray-400 underline">
        この業者に関する権利侵害・削除申請はこちら
      </a>
    </main>
  );
}
