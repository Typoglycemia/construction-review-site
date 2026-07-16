// app/sitemap.ts
import { MetadataRoute } from "next";
import { supabasePublic } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/ranking/good`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/ranking/bad`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/prefecture`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/category`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/companies/new`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // 公開済み業者ページ(件数が多い場合は複数サイトマップに分割することを推奨)
  const { data: companies } = await supabasePublic
    .from("companies")
    .select("id, updated_at")
    .eq("status", "published")
    .limit(50000);

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${SITE_URL}/companies/${c.id}`,
    lastModified: c.updated_at,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...companyRoutes];
}
