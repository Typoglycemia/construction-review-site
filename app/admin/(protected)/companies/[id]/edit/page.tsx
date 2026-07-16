// app/admin/(protected)/companies/[id]/edit/page.tsx
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export default async function AdminCompanyEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!company) notFound();

  return (
    <main className="max-w-xl">
      <h1 className="text-lg font-medium mb-4">業者情報を編集</h1>
      <form action={`/api/admin/companies/${company.id}/update`} method="post" className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">会社名</label>
          <input
            name="name"
            defaultValue={company.name}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">都道府県</label>
          <input
            name="prefecture"
            defaultValue={company.prefecture ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">市区町村</label>
          <input
            name="city"
            defaultValue={company.city ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">住所</label>
          <input
            name="address"
            defaultValue={company.address ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">電話番号</label>
          <input
            name="phone"
            defaultValue={company.phone ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">公式サイトURL</label>
          <input
            name="website_url"
            defaultValue={company.website_url ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">業種</label>
          <input
            name="category"
            defaultValue={company.category ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">ロゴ画像URL</label>
          <input
            name="logo_url"
            defaultValue={company.logo_url ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">法人番号</label>
          <input
            name="corporate_number"
            defaultValue={company.corporate_number ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">建設業許可情報</label>
          <input
            name="license_information"
            defaultValue={company.license_information ?? ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button className="bg-black text-white px-6 py-2 rounded">保存する</button>
      </form>
    </main>
  );
}
