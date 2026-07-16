// components/Footer.tsx
import Link from "next/link";

const LINKS = [
  { href: "/about", label: "このサイトについて" },
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/guidelines", label: "投稿ガイドライン" },
  { href: "/takedown-request", label: "削除依頼・権利侵害申告" },
  { href: "/contact", label: "お問い合わせ" },
];

export default function Footer() {
  return (
    <footer className="border-t-2 border-ink/20 bg-white text-ink mt-12">
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-ink/70 space-y-4">
        <p>
          このサイトは、全国の建設会社・工務店・リフォーム会社などについて、ユーザーが匿名で
          「良い！」「悪い！」の投票やコメントを投稿できるサービスです。投稿者の個人情報や
          アクセス情報が一般ユーザーや掲載業者に公開されることはありません。ただし、不正利用防止、
          サービスの安全な運営、権利侵害への対応等のため、運営者は必要な範囲でアクセス情報等を
          取得する場合があります。
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-paper hover:text-caution hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
	<p className="text-xs text-ink/50">
          業者情報の一部は「gBizINFO」(経済産業省)のデータを二次利用して掲載しています。
        </p>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} 下請けドットコム. 掲載されている評価やコメントはユーザーによる
          投稿です。当サイトが特定の業者の品質・安全性・違法性等を保証または断定するものではありません。
        </p>
      </div>
    </footer>
  );
}
