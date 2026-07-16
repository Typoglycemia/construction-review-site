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
  const [stamped, setStamped] = useState<"good" | "bad" | null>(null);

  const total = votes.goodCount + votes.badCount;
  const goodPct = total > 0 ? Math.round((votes.goodCount / total) * 100) : 0;
  const badPct = total > 0 ? 100 - goodPct : 0;

  async function handleVote(voteType: "good" | "bad") {
    setSubmitting(true);
    setMessage(null);
    try {
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
      setStamped(voteType);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-ink p-4 bg-white">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StampButton
          label="良い"
          color="inspect"
          onClick={() => handleVote("good")}
          disabled={submitting}
          active={stamped === "good"}
        />
        <StampButton
          label="悪い"
          color="seal"
          onClick={() => handleVote("bad")}
          disabled={submitting}
          active={stamped === "bad"}
        />
      </div>

      <TurnstileWidget />

      <div className="flex h-2 mb-1 border border-ink/30">
        <div className="bg-inspect" style={{ width: `${goodPct}%` }} />
        <div className="bg-seal" style={{ width: `${badPct}%` }} />
      </div>
      <div className="flex justify-between text-sm font-mono">
        <span>良い！ {goodPct}%（{votes.goodCount.toLocaleString()}票）</span>
        <span>悪い！ {badPct}%（{votes.badCount.toLocaleString()}票）</span>
      </div>
      <p className="text-xs font-mono text-ink/60 mt-1">総投票数 {total.toLocaleString()}票</p>
      {message && <p className="text-sm text-seal mt-2">{message}</p>}
    </div>
  );
}

function StampButton({
  label,
  color,
  onClick,
  disabled,
  active,
}: {
  label: string;
  color: "inspect" | "seal";
  onClick: () => void;
  disabled: boolean;
  active: boolean;
}) {
  const borderColor = color === "inspect" ? "border-inspect" : "border-seal";
  const textColor = color === "inspect" ? "text-inspect" : "text-seal";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "relative py-6 font-display font-bold text-2xl border-4 rounded-full " +
        borderColor +
        " " +
        textColor +
        " transition-transform duration-150 ease-out " +
        (active ? "scale-105 rotate-[-3deg]" : "hover:scale-[1.02]")
      }
      style={{
        boxShadow: active ? "inset 0 0 0 3px currentColor" : undefined,
      }}
    >
      {label}！
    </button>
  );
}
