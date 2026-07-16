"use client";
// app/contact/page.tsx
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p>お問い合わせを受け付けました。内容を確認のうえ、必要に応じてご連絡いたします。</p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">お問い合わせ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">お名前(任意)</label>
          <input name="name" className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">連絡先メールアドレス(必須)</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">お問い合わせ内容(必須)</label>
          <textarea name="message" required rows={6} className="w-full border rounded px-3 py-2" />
        </div>
        <button className="bg-black text-white px-6 py-2 rounded">送信する</button>
      </form>
    </main>
  );
}
