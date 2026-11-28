import { canonicalWriterSlug, writerPath } from "@/lib/writerPaths";
import { publicArticles } from "@/lib/articleWorkflow";
import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { schools } from "@/lib/schools";
import { articlePath, legacyArticleSlug } from "@/lib/articlePaths";
import { canonicalSite as siteUrl } from "@/lib/pageMetadata";


// Article slugs can be edited after publishing. Always read the current rows
// from Supabase so the sitemap never retains a previous slug in an ISR cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SitemapArticle = {
  slug: string;
  title?: string;
  category?: string;
  excerpt?: string;
  published_at: string | null;
  content_updated_at?: string | null;
  updated_at?: string | null;
  school?: string | null;
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
      .select("*")
      .or(publicArticles())
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
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { data: writers } = await db.from("writer_profiles").select("slug");

  const latest = articles.map(a => a.content_updated_at || a.published_at).filter((date): date is string => Boolean(date)).sort().at(-1);
  // Static dates come from each page's editorial history. The basketball feed
  // also changes whenever one of its published stories changes.
  const basketballDates = articles.filter(article =>
    /basketball|cbb/i.test([article.category, article.title, article.excerpt].join(" ")) ||
    ["n", legacyArticleSlug].includes(article.slug))
    .map(article => article.content_updated_at || article.updated_at || article.published_at);
  const basketballModified = basketballDates.reduce<string>((newest, date) =>
    date && Date.parse(date) > Date.parse(newest) ? date : newest, "2026-11-26");
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: latest,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/schools`,
      lastModified: latest,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: latest,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/recruiting`,
      lastModified: articles.filter(a => a.school === "Recruiting").map(a => a.content_updated_at || a.published_at).filter((date): date is string => Boolean(date)).sort().at(-1),
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${siteUrl}/college-football`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/tv-guide`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/boards`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/basketball`, lastModified: basketballModified, changeFrequency: "daily", priority: 0.8 },
    { url: siteUrl + "/about", lastModified: "2026-11-26", changeFrequency: "monthly", priority: 0.6 },
    { url: siteUrl + "/privacy", lastModified: "2026-11-24", changeFrequency: "yearly", priority: 0.3 },
    { url: siteUrl + "/terms", lastModified: "2026-11-24", changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/advertise`, lastModified: "2026-11-26", changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/newsletter`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/writers`, changeFrequency: "weekly", priority: 0.7 },
    ...(writers || []).filter(writer => canonicalWriterSlug(writer.slug) === writer.slug).map(writer => ({ url: siteUrl + writerPath(writer.slug), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...schools.map((school) => ({
      url: `${siteUrl}/schools/${school.slug}`,
      lastModified: articles.filter(a => a.school === school.name).map(a => a.content_updated_at || a.published_at).filter((date): date is string => Boolean(date)).sort().at(-1),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  const hasRenamedArticle = articles.some(article => article.slug === legacyArticleSlug);
  const articlePages: MetadataRoute.Sitemap = articles.filter(article => !hasRenamedArticle || article.slug !== "n").map((article) => ({
    url: siteUrl + articlePath(article.slug),
    lastModified: article.content_updated_at || article.updated_at || article.published_at || undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...publicPages, ...articlePages];
}
