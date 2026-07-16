"use client";
// app/companies/[id]/edit-request/page.tsx
import { useState } from "react";
import { useParams } from "next/navigation";

export default function EditRequestPage() {
  const params = useParams();
  const companyId = params.id as string;
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/companies/edit-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        proposedChanges: Object.fromEntries(form),
      }),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center text-sm text-gray-600">
        <p>修正依頼を受け付けました。管理者が確認のうえ反映いたします。</p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-2">情報の修正を依頼する</h1>
      <p className="text-sm text-gray-500 mb-6">
        修正内容は即時反映されず、管理者の確認後に反映されます。
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">会社名または屋号</label>
          <input name="name" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">住所</label>
          <input name="address" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">電話番号</label>
          <input name="phone" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">公式サイトURL</label>
          <input name="websiteUrl" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">修正理由・詳細</label>
          <textarea name="reason" rows={4} className="w-full border rounded px-3 py-2" />
        </div>
        <button className="bg-black text-white px-6 py-2 rounded">依頼する</button>
      </form>
    </main>
  );
}
