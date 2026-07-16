"use client";
// components/VotePanel.tsx
import { useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";

type VotePanelProps = {
  companyId: string;
  initialVotes: { goodCount: number; badCount: number };
};

export default function VotePanel({ companyId, initialVotes }: VotePanelProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const total = votes.goodCount + votes.badCount;
  const goodPct = total > 0 ? Math.round((votes.goodCount / total) * 100) : 0;
  const badPct = total > 0 ? 100 - goodPct : 0;

  async function handleVote(voteType: "good" | "bad") {
    setSubmitting(true);
    setMessage(null);
    try {
      // turnstileToken は実際にはCloudflare Turnstileウィジェットから取得する
      const turnstileToken = (window as any).__turnstileToken ?? "";
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, voteType, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "投票に失敗しました。");
        return;
      }
      setVotes((v) => ({
        goodCount: v.goodCount + (voteType === "good" ? 1 : 0),
        badCount: v.badCount + (voteType === "bad" ? 1 : 0),
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => handleVote("good")}
          disabled={submitting}
          className="py-4 text-lg font-medium border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
        >
          良い！
        </button>
        <button
          onClick={() => handleVote("bad")}
          disabled={submitting}
          className="py-4 text-lg font-medium border-2 border-red-600 text-red-700 rounded-lg hover:bg-red-50"
        >
          悪い！
        </button>
      </div>
	<TurnstileWidget />
      <div className="flex h-2 rounded overflow-hidden mb-1">
        <div className="bg-green-600" style={{ width: `${goodPct}%` }} />
        <div className="bg-red-600" style={{ width: `${badPct}%` }} />
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          良い！ {goodPct}% ({votes.goodCount.toLocaleString()}票)
        </span>
        <span>
          悪い！ {badPct}% ({votes.badCount.toLocaleString()}票)
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">総投票数 {total.toLocaleString()}票</p>
      {message && <p className="text-sm text-red-600 mt-2">{message}</p>}
    </div>
  );
}
