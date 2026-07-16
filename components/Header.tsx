// components/Header.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/search", label: "業者を検索" },
  { href: "/ranking/good", label: "ランキング" },
  { href: "/prefecture", label: "都道府県から探す" },
  { href: "/category", label: "業種から探す" },
  { href: "/companies/new", label: "業者を追加" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white text-ink border-b-2 border-ink/20">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-steel text-white font-brush text-xl px-3 py-1 rounded">
            下請け
          </span>
          <span className="font-bold text-xl text-ink">.com</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-steel hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden text-sm border border-paper/40 px-3 py-1"
          onClick={() => setOpen((o) => !o)}
          aria-label="メニュー"
        >
          メニュー
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-paper/20 px-4 py-2 flex flex-col gap-2 text-sm bg-ink">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
