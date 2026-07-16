// app/prefecture/page.tsx
import Link from "next/link";
import { supabasePublic } from "@/lib/supabase";

const REGIONS: Record<string, string[]> = {
  "北海道・東北": ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  "中部": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
  "近畿": ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
  "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
};

export const metadata = { title: "都道府県から探す" };

export default async function PrefecturePage() {
  const { data } = await supabasePublic
    .from("companies")
    .select("prefecture")
    .eq("status", "published");

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.prefecture, (counts.get(row.prefecture) ?? 0) + 1);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-semibold">都道府県から探す</h1>
      {Object.entries(REGIONS).map(([region, prefectures]) => (
        <div key={region}>
          <h2 className="font-medium mb-2">{region}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {prefectures.map((p) => (
              <Link
                key={p}
                href={`/prefecture/${encodeURIComponent(p)}`}
                className="flex justify-between border rounded px-3 py-2 hover:bg-gray-50"
              >
                <span>{p}</span>
                <span className="text-gray-400">{counts.get(p) ?? 0}社</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
