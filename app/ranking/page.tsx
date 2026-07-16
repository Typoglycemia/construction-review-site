// app/ranking/page.tsx
import Link from "next/link";

export const metadata = { title: "ランキング一覧" };

export default function RankingIndexPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-xl font-semibold mb-4">ランキング</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/ranking/good"
          className="border-2 border-ink/10 hover:border-steel transition p-6 text-center"
        >
          <p className="text-lg font-bold">良い業者ランキング</p>
        </Link>
        <Link
          href="/ranking/bad"
          className="border-2 border-ink/10 hover:border-steel transition p-6 text-center"
        >
          <p className="text-lg font-bold">悪い業者ランキング</p>
        </Link>
      </div>
    </main>
  );
}
