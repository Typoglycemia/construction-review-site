"use client";
// app/takedown-request/page.tsx
import { useState } from "react";

const REQUEST_TYPES = [
  { value: "wrong_info", label: "会社情報が間違っている" },
  { value: "confused_with_other", label: "別会社と混同されている" },
  { value: "rights_violation", label: "権利侵害がある" },
  { value: "problematic_comment", label: "コメントに問題がある" },
  { value: "personal_info_exposed", label: "個人情報が掲載されている" },
];

export default function TakedownRequestPage() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/takedown-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center text-sm text-gray-600">
        <p>
          お申し出を受け付けました。内容を個別に確認のうえ対応いたします。単に評価が悪いという
          理由のみで自動的に削除することはありませんので、あらかじめご了承ください。
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-2">削除依頼・権利侵害申告</h1>
      <p className="text-sm text-gray-500 mb-6">
        掲載業者または権利者の方は、以下のフォームからお申し出ください。内容は管理者が個別に
        確認します。
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">対象の業者ページURLまたは会社名</label>
          <input name="target" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">申請内容</label>
          <select name="requestType" required className="w-full border rounded px-3 py-2">
            <option value="">選択してください</option>
            {REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">詳細</label>
          <textarea name="detail" required rows={6} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">連絡先メールアドレス</label>
          <input
            name="contactEmail"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button className="bg-black text-white px-6 py-2 rounded">申請する</button>
      </form>
    </main>
  );
}
