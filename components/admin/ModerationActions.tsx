"use client";
// components/admin/ModerationActions.tsx
import { useState } from "react";

export default function ModerationActions({ commentId }: { commentId: string }) {
  const [loading, setLoading] = useState(false);

  async function act(action: "hide" | "restore" | "delete") {
    setLoading(true);
    try {
      await fetch(`/api/admin/comments/${commentId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 text-xs">
      <button disabled={loading} onClick={() => act("hide")} className="text-amber-700">
        非公開
      </button>
      <button disabled={loading} onClick={() => act("restore")} className="text-green-700">
        復元
      </button>
      <button disabled={loading} onClick={() => act("delete")} className="text-red-700">
        削除
      </button>
    </div>
  );
}
