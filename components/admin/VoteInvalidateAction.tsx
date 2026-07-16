"use client";
// components/admin/VoteInvalidateAction.tsx
import { useState } from "react";

export default function VoteInvalidateAction({
  voteId,
  currentlyValid,
}: {
  voteId: string;
  currentlyValid: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/admin/votes/${voteId}/toggle-valid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isValid: !currentlyValid }),
      });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button disabled={loading} onClick={toggle} className="text-xs text-blue-600">
      {currentlyValid ? "無効化する" : "有効に戻す"}
    </button>
  );
}
