// app/admin/layout.tsx
// 管理画面共通レイアウト。Supabase Authのセッションからadminsテーブルのroleを確認する。
// 実運用ではmiddleware.tsでも同様のチェックを行い、二重で保護すること。

import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase";

async function getCurrentAdmin() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("id, email, role")
    .eq("email", user.email)
    .maybeSingle();

  return admin;
}

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "ダッシュボード", roles: ["super_admin", "moderator", "support"] },
  { href: "/admin/companies", label: "業者管理", roles: ["super_admin", "moderator"] },
  { href: "/admin/companies/duplicates", label: "重複業者候補", roles: ["super_admin", "moderator"] },
  { href: "/admin/votes", label: "投票管理", roles: ["super_admin", "moderator"] },
  { href: "/admin/comments", label: "コメント管理", roles: ["super_admin", "moderator"] },
  { href: "/admin/reports", label: "通報管理", roles: ["super_admin", "moderator"] },
  { href: "/admin/submissions", label: "登録・修正申請", roles: ["super_admin", "moderator"] },
  { href: "/admin/takedowns", label: "削除・権利侵害申請", roles: ["super_admin"] },
  { href: "/admin/audit-logs", label: "監査ログ", roles: ["super_admin"] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(admin.role));

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r p-4 space-y-1">
        <p className="text-xs text-gray-400 mb-2">{admin.email}({admin.role})</p>
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block text-sm py-2 px-2 rounded hover:bg-gray-100"
          >
            {item.label}
          </Link>
        ))}
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
