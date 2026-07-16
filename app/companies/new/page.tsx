"use client";
// app/companies/new/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";

const PREFECTURES = ["埼玉県", "東京都", "大阪府" /* ...47都道府県 */];
const CATEGORIES = ["総合建設", "工務店", "リフォーム", "内装", "大工", "塗装", "電気工事"];

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    prefecture: "",
    city: "",
    phone: "",
    websiteUrl: "",
    category: "",
  });
  const [duplicateWarning, setDuplicateWarning] = useState<{
    confidence: "high" | "medium";
    existingCompanyId?: string;
    message: string;
  } | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.prefecture) return;
    const turnstileToken = (window as any).__turnstileToken ?? "";
    const res = await fetch("/api/companies/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, turnstileToken }),
    });
    const data = await res.json();

    if (data.duplicate && data.confidence === "high") {
      setDuplicateWarning(data);
      return;
    }

    setSubmitted(data.message);
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-xl font-semibold">業者を新しく追加する</h1>
      <p className="text-sm text-gray-500">
        既存業者と重複しないよう、会社名を入力すると自動で類似業者を確認します。
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">会社名または屋号(必須)</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {duplicateWarning?.confidence === "high" && (
          <div className="border border-amber-400 bg-amber-50 text-amber-800 text-sm rounded p-3">
            {duplicateWarning.message}
            {duplicateWarning.existingCompanyId && (
              <a
                href={`/companies/${duplicateWarning.existingCompanyId}`}
                className="block underline mt-1"
              >
                既存の業者ページを見る
              </a>
            )}
          </div>
        )}

        <div>
          <label className="text-sm text-gray-600">都道府県(必須)</label>
          <select
            value={form.prefecture}
            onChange={(e) => update("prefecture", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">市区町村</label>
          <input
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">業種</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">選択してください</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">電話番号</label>
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">公式サイトURL</label>
          <input
            value={form.websiteUrl}
            onChange={(e) => update("websiteUrl", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
	<TurnstileWidget />
      <button onClick={handleSubmit} className="bg-black text-white px-6 py-2 rounded">
        登録申請する
      </button>

      {submitted && <p className="text-sm text-gray-600">{submitted}</p>}
    </main>
  );
}
