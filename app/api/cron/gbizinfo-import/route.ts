// app/api/cron/gbizinfo-import/route.ts
// gBizINFO REST APIから建設関連キーワードで法人情報を検索し、
// 未登録の業者をcompaniesテーブルへ自動登録するバッチ。
// データ出典: 経済産業省 gBizINFO（政府標準利用規約 第2.0版に基づく）
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeCompanyName } from "@/lib/dedupe";

const GBIZ_TOKEN = process.env.GBIZINFO_API_TOKEN!;
const KEYWORDS = ["建築", "建設", "工務店", "リフォーム", "塗装", "解体", "外構", "電気工事"];
const MAX_PAGES_PER_KEYWORD = 3;

const PREFECTURE_LIST = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県",
  "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

function extractPrefecture(address: string): string | null {
  for (const p of PREFECTURE_LIST) {
    if (address.startsWith(p)) return p;
  }
  return null;
}

async function fetchGbizPage(keyword: string, page: number) {
  const url = new URL("https://info.gbiz.go.jp/hojin/v1/hojin");
  url.searchParams.set("name", keyword);
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    headers: {
      "X-hojinInfo-api-token": GBIZ_TOKEN,
      Accept: "application/json",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data["hojin-infos"] ?? [];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let fetched = 0;
  let inserted = 0;
  let skippedClosed = 0;
  let skippedExisting = 0;

  for (const keyword of KEYWORDS) {
    for (let page = 1; page <= MAX_PAGES_PER_KEYWORD; page++) {
      const items = await fetchGbizPage(keyword, page);
      if (items.length === 0) break;

      for (const item of items) {
        fetched++;

        if (item.status === "閉鎖") {
          skippedClosed++;
          continue;
        }

        const { data: existing } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("corporate_number", item.corporate_number)
          .maybeSingle();

        if (existing) {
          skippedExisting++;
          continue;
        }

        const prefecture = extractPrefecture(item.location ?? "") ?? "不明";

        const { error } = await supabaseAdmin.from("companies").insert({
          name: item.name,
          normalized_name: normalizeCompanyName(item.name),
          corporate_number: item.corporate_number,
          postal_code: item.postal_code,
          prefecture,
          address: item.location,
          category: keyword,
          source_type: "official_data",
          status: "published",
        });

        if (!error) inserted++;
      }
    }
  }

  return NextResponse.json({ ok: true, fetched, inserted, skippedClosed, skippedExisting });
}
