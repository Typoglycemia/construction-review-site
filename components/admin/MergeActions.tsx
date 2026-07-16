"use client";
// components/admin/MergeActions.tsx
import { useState } from "react";

export default function MergeActions({
  candidateId,
  companyIdA,
  companyIdB,
}: {
  candidateId: string;
  companyIdA: string;
  companyIdB: string;
}) {
  const [loading, setLoading] = useState(false);
  const [keepId, setKeepId] = useState(companyIdA);

  async function merge() {
    setLoading(true);
    try {
      const mergeIntoId = keepId;
      const mergedFromId = keepId === companyIdA ? companyIdB : companyIdA;
      await fetch("/api/admin/companies/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, mergeIntoId, mergedFromId }),
      });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    setLoading(true);
    try {
      await fetch("/api/admin/companies/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, reject: true }),
      });
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <label>
        <input
          type="radio"
          checked={keepId === companyIdA}
          onChange={() => setKeepId(companyIdA)}
        />{" "}
        Aを正として統合
      </label>
      <label>
        <input
          type="radio"
          checked={keepId === companyIdB}
          onChange={() => setKeepId(companyIdB)}
        />{" "}
        Bを正として統合
      </label>
      <button disabled={loading} onClick={merge} className="text-blue-600">
        統合する
      </button>
      <button disabled={loading} onClick={reject} className="text-gray-500">
        別会社として却下
      </button>
    </div>
  );
}
