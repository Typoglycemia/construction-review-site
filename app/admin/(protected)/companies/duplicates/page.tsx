// app/admin/companies/duplicates/page.tsx
// 重複業者候補の一覧・差分表示・統合/却下UI(14章対応)

import { supabaseAdmin } from "@/lib/supabase";
import MergeActions from "@/components/admin/MergeActions";

export default async function DuplicateCandidatesPage() {
  const { data: candidates } = await supabaseAdmin
    .from("company_merge_candidates")
    .select(
      "id, similarity_score, match_reason, status, company_a:companies!company_id_a(id, name, prefecture, city, phone), company_b:companies!company_id_b(id, name, prefecture, city, phone)"
    )
    .eq("status", "pending")
    .order("similarity_score", { ascending: false });

  return (
    <main>
      <h1 className="text-lg font-medium mb-4">重複業者候補</h1>
      <div className="space-y-4">
        {(candidates ?? []).map((c: any) => (
          <div key={c.id} className="border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">
              一致理由: {c.match_reason} / 類似度: {Math.round(c.similarity_score * 100)}%
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <CompanyDiffCard company={c.company_a} />
              <CompanyDiffCard company={c.company_b} />
            </div>
            <MergeActions
              candidateId={c.id}
              companyIdA={c.company_a.id}
              companyIdB={c.company_b.id}
            />
          </div>
        ))}
        {(candidates ?? []).length === 0 && (
          <p className="text-sm text-gray-500">現在確認待ちの重複候補はありません。</p>
        )}
      </div>
    </main>
  );
}

function CompanyDiffCard({ company }: { company: any }) {
  return (
    <div className="border rounded p-3">
      <p className="font-medium">{company.name}</p>
      <p className="text-gray-500">
        {company.prefecture}
        {company.city}
      </p>
      <p className="text-gray-500">{company.phone ?? "電話番号未登録"}</p>
    </div>
  );
}
