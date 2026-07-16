"use client";
// components/admin/ViewIpButton.tsx
import { useState } from "react";

export default function ViewIpButton({ accessLogId }: { accessLogId: string }) {
  const [ip, setIp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleView() {
    const reason = prompt("閲覧理由を入力してください(例: 不正投稿の調査のため)");
    if (!reason || !reason.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/access-logs/decrypt-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessLogId, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setIp(data.ip);
      } else {
        alert(data.message || "取得に失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  }

  if (ip) {
    return <span className="text-xs font-mono text-red-700">{ip}</span>;
  }

  return (
    <button
      disabled={loading}
      onClick={handleView}
      className="text-xs text-blue-600 underline"
    >
      IPを見る
    </button>
  );
}
