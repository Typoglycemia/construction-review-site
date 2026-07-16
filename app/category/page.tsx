// app/category/page.tsx
import Link from "next/link";

const CATEGORIES = [
  { slug: "general", label: "総合建設" },
  { slug: "builder", label: "工務店" },
  { slug: "reform", label: "リフォーム" },
  { slug: "interior", label: "内装" },
  { slug: "carpenter", label: "大工" },
  { slug: "wallpaper", label: "クロス" },
  { slug: "paint", label: "塗装" },
  { slug: "electric", label: "電気工事" },
  { slug: "facility", label: "設備工事" },
  { slug: "plumbing", label: "水道" },
  { slug: "roof", label: "屋根" },
  { slug: "waterproof", label: "防水" },
  { slug: "demolition", label: "解体" },
  { slug: "exterior", label: "外構" },
  { slug: "cleaning", label: "ハウスクリーニング" },
];

export const metadata = { title: "業種から探す" };

export default function CategoryPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">業種から探す</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="border rounded-lg p-4 text-center hover:bg-gray-50"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
