import { createClient } from "@supabase/supabase-js";
import type { Article } from "@/components/ArticleCard";
import { schools } from "@/lib/schools";
import { attachWriters } from "@/lib/writers";
import { canonicalSite } from "@/lib/pageMetadata";
import { articlePath } from "@/lib/articlePaths";

export { articlePath, legacyArticleSlug } from "@/lib/articlePaths";

export const boards = [
  { name: "CFP Bubble & Bye Board", detail: "Projected bracket, first-round byes and bubble teams.", path: "/articles/2026-college-football-playoff-picture-bubble-watch-projected-bracket" },
  { name: "Coaching Carousel Tracker", detail: "FBS hires, firings and open jobs.", path: "/articles/2026-college-football-coaching-carousel-tracker" },
  { name: "Bowl Eligibility Tracker", detail: "Who has clinched and who still needs a win.", path: "/articles/2026-college-football-bowl-eligibility-tracker" },
];

export const schoolByName = (name?: string | null) => schools.find(school => school.name.toLowerCase() === name?.trim().toLowerCase());
export const footballCategories = ["College Football", "Breaking News", "Recruiting", "Transfer Portal", "Coaching"];

export function editorialClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }) },
  });
}

export async function stories({ school, football, recruiting, category, titleContains, limit = 24 }: {
  school?: string; football?: boolean; recruiting?: boolean; category?: string; titleContains?: string; limit?: number;
} = {}): Promise<Article[]> {
  const db = editorialClient();
  let query = db.from("articles").select("id,slug,title,excerpt,cover_image_url,category,school,published_at,is_top_story,writer_profile_id,byline:body->>author_name,author_name").eq("status", "published");
  if (school) query = query.eq("school", school);
  if (football) query = query.in("category", footballCategories);
  if (category) query = query.eq("category", category);
  if (titleContains) query = query.ilike("title", `%${titleContains}%`);
  if (recruiting) query = query.or("category.eq.Recruiting,school.eq.Recruiting").gte("published_at", new Date(Math.floor(Date.now() / 86400000) * 86400000 - 14 * 86400000).toISOString());
  const { data, error } = await query.order("published_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return attachWriters(db, (data ?? []).map(row => ({ ...row, body: { author_name: row.byline || row.author_name || undefined } })));
}

export function itemList(name: string, items: {name: string; path: string}[]) {
  return { "@context": "https://schema.org", "@type": "ItemList", name, itemListElement: items.map(({ name, path }, index) => ({
    "@type": "ListItem", position: index + 1, name, url: canonicalSite + path,
  })) };
}

export const storyList = (name: string, articles: Article[]) => itemList(name, articles.map(article => ({ name: article.title, path: articlePath(article.slug) })));

export function editorialDate(date: string, withTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } : {}),
  }).format(new Date(date));
}
