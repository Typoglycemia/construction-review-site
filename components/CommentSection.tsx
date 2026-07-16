"use client";
// components/CommentSection.tsx
import { useMemo, useState } from "react";
import VoteBadge from "@/components/VoteBadge";
import TurnstileWidget from "@/components/TurnstileWidget";

type CommentItem = {
  id: string;
  sentiment: "good" | "bad";
  nickname: string | null;
  body: string;
  helpful_count: number;
  created_at: string;
};

type SortKey = "new" | "old" | "helpful" | "good_only" | "bad_only";

export default function CommentSection({
  companyId,
  initialComments,
}: {
  companyId: string;
  initialComments: CommentItem[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [sort, setSort] = useState<SortKey>("new");
  const [sentiment, setSentiment] = useState<"good" | "bad">("good");
  const [body, setBody] = useState("");
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const sorted = useMemo(() => {
    let list = [...comments];
    if (sort === "good_only") list = list.filter((c) => c.sentiment === "good");
    if (sort === "bad_only") list = list.filter((c) => c.sentiment === "bad");
    if (sort === "new")
      list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === "old")
      list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sort === "helpful") list.sort((a, b) => b.helpful_count - a.helpful_count);
    return list;
  }, [comments, sort]);

  async function handleSubmit() {
    if (!body.trim()) return;
    setPendingNotice(null);
    const turnstileToken = (window as any).__turnstileToken ?? "";
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, sentiment, commentBody: body, turnstileToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPendingNotice(data.message ?? "投稿に失敗しました。");
      return;
    }
    if (data.pendingReview) {
      setPendingNotice("投稿を受け付けました。内容確認のため反映まで少し時間がかかる場合があります。");
    } else if (data.comment) {
      setComments((c) => [data.comment, ...c]);
    }
    setBody("");
  }

  async function handleHelpful(commentId: string) {
    await fetch(`/api/comments/${commentId}/helpful`, { method: "POST" });
    setComments((cs) =>
      cs.map((c) => (c.id === commentId ? { ...c, helpful_count: c.helpful_count + 1 } : c))
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          匿名コメント <span className="text-steel">{comments.length}件</span>
        </h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="new">新しい順</option>
          <option value="old">古い順</option>
          <option value="helpful">参考になった順</option>
          <option value="good_only">良いコメントのみ</option>
          <option value="bad_only">悪いコメントのみ</option>
        </select>
      </div>

      <div className="divide-y divide-ink/10">
        {sorted.map((c) => (
          <div key={c.id} className="py-4 text-base">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-600">{c.nickname || "匿名"}</span>
              <VoteBadge sentiment={c.sentiment} />
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(c.created_at).toLocaleString("ja-JP")}
              </span>
            </div>
            <p className="mb-2">{c.body}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <button onClick={() => handleHelpful(c.id)}>参考になった {c.helpful_count}</button>
              <a href={`/reports/new?comment_id=${c.id}`}>通報</a>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setSentiment("good")}
            className={
              "flex-1 py-1 border rounded " +
              (sentiment === "good" ? "border-green-600 text-green-700" : "border-gray-300")
            }
          >
            良い
          </button>
          <button
            onClick={() => setSentiment("bad")}
            className={
              "flex-1 py-1 border rounded " +
              (sentiment === "bad" ? "border-red-600 text-red-700" : "border-gray-300")
            }
          >
            悪い
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="事実に基づいた内容を投稿してください。個人情報や違法な内容の投稿は禁止されています。"
          className="w-full border rounded p-2 text-sm"
          rows={3}
        />
	<TurnstileWidget />
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">投稿内容については投稿者自身が責任を負います。</p>
          <button
            onClick={handleSubmit}
            className="bg-black text-white text-sm px-4 py-2 rounded"
          >
            匿名で投稿する
          </button>
        </div>
        {pendingNotice && <p className="text-xs text-gray-600">{pendingNotice}</p>}
      </div>
    </section>
  );
}
