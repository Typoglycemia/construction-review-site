"use client";
// components/admin/CompanyStatusActions.tsx
import { useState } from "react";

export default function CompanyStatusActions({
  companyId,
  currentStatus,
}: {
  companyId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);

  async function setStatus(status: "hidden" | "published") {
    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${companyId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function hardDelete() {
    const ok = confirm(
      "本当に完全削除しますか?この操作は取り消せません。関連する投票・コメントも全て削除されます。"
    );
    if (!ok) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${companyId}`, { method: "DELETE" });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 text-xs">
      {currentStatus !== "hidden" && (
        <button disabled={loading} onClick={() => setStatus("hidden")} className="text-amber-700">
          非公開にする
        </button>
      )}
      {currentStatus === "hidden" && (
        <button disabled={loading} onClick={() => setStatus("published")} className="text-green-700">
          公開に戻す
        </button>
      )}
      <button disabled={loading} onClick={hardDelete} className="text-red-700">
        完全削除
      </button>
    </div>
  );
}
