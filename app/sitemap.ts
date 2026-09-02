import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { schools } from "@/lib/schools";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.toptierstate.net"
).replace(/\/$/, "");

// Article slugs can be edited after publishing. Always read the current rows
// from Supabase so the sitemap never retains a previous slug in an ISR cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SitemapArticle = {
  slug: string;
  published_at: string | null;
  updated_at: string | null;
};

async function getPublishedArticles() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const articles: SitemapArticle[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("articles")
      .select("slug,published_at,updated_at")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Unable to generate the article sitemap:", error.message);
      break;
    }

    const page = (data ?? []) as SitemapArticle[];
    articles.push(...page);
    if (page.length < pageSize) break;
  }

  return articles;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles();

  const publicPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/schools`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/articles`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/recruiting`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...schools.map((school) => ({
      url: `${siteUrl}/schools/${school.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${encodeURIComponent(article.slug)}`,
    lastModified: article.updated_at || article.published_at || undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...publicPages, ...articlePages];
}
