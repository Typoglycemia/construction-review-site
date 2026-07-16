"use client";
// app/admin/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("ログインに失敗しました。メールアドレスとパスワードをご確認ください。");
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-lg font-medium mb-4">管理者ログイン</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full bg-black text-white py-2 rounded">ログイン</button>
      </form>
      <p className="text-xs text-gray-400 mt-4">
        ※ 2段階認証(MFA)の設定を強く推奨します(Supabase Auth側で設定)。
      </p>
    </main>
  );
}
