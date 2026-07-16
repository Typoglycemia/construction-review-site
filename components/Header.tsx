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
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          建設業者クチコミ
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-gray-600">
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden text-sm border rounded px-3 py-1"
          onClick={() => setOpen((o) => !o)}
          aria-label="メニュー"
        >
          メニュー
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t px-4 py-2 flex flex-col gap-2 text-sm">
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
