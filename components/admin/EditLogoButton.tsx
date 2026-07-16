"use client";
import { useState } from "react";

export default function EditLogoButton({
  companyId,
  currentLogoUrl,
}: {
  companyId: string;
  currentLogoUrl: string | null;
}) {
  const [loading, setLoading] = useState(false);

  async function handleEdit() {
    const url = prompt("ロゴ画像のURLを入力してください(空欄で削除)", currentLogoUrl ?? "");
    if (url === null) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/companies/${companyId}/logo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url }),
      });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button disabled={loading} onClick={handleEdit} className="text-xs text-blue-600">
      ロゴ編集
    </button>
  );
}
