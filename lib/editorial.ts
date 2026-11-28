import { cache } from "react";
import { trackerStat, type TrackerMetric } from "@/lib/trackerStats";
import { publicArticles } from "@/lib/articleWorkflow";
import { createClient } from "@supabase/supabase-js";
import type { Article } from "@/components/ArticleCard";
import { schools } from "@/lib/schools";
import { attachWriters } from "@/lib/writers";
import { canonicalSite } from "@/lib/pageMetadata";
import { articlePath, legacyArticleSlug } from "@/lib/articlePaths";

export { articlePath, legacyArticleSlug } from "@/lib/articlePaths";

export const boards = [
  { metric: "playoff", topic: "Playoff", name: "CFP Bubble & Bye Board", detail: "Projected bracket, first-round byes and bubble teams.", path: "/articles/2026-college-football-playoff-picture-bubble-watch-projected-bracket" },
  { metric: "coaching", topic: "Coaching Carousel", name: "Coaching Carousel Tracker", detail: "FBS hires, firings and open jobs.", path: "/articles/2026-college-football-coaching-carousel-tracker" },
  { metric: "bowl", topic: "Bowl Eligibility", name: "Bowl Eligibility Tracker", detail: "Who has clinched and who still needs a win.", path: "/articles/2026-college-football-bowl-eligibility-tracker" },
] as const satisfies readonly { metric: TrackerMetric; topic: string; name: string; detail: string; path: string }[];

const schoolAliases: Record<string, string> = { "mizzou": "missouri", "wvu": "west-virginia", "florida st": "fsu", "mississippi st": "mississippi-state", "southern california": "usc" };
export const schoolByName = (name?: string | null) => {
  const label = name?.trim().toLowerCase().replace(/\s+(?:sports|cfb(?: & cbb)?)$/i, "");
  return schools.find(school => school.name.toLowerCase() === label || school.slug === label || school.slug === schoolAliases[label ?? ""]);
};
export const footballCategories = ["College Football", "Breaking News", "Recruiting", "Transfer Portal", "Coaching"];

export function editorialClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60 } }) },
  });
}

export const liveTrackers = cache(async () => {
  const slugs = boards.map(board => board.path.slice("/articles/".length));
  const { data, error } = await editorialClient().from("articles")
    .select("slug,title,excerpt,body,updated_at")
    .in("slug", slugs).or(publicArticles());
  if (error) console.warn("Unable to load live tracker metadata:", error.message);
  const articles = new Map((data ?? []).map(article => [article.slug, article]));
  return boards.map(board => {
    const article = articles.get(board.path.slice("/articles/".length));
    const updatedAt = article?.updated_at;
    return {
      ...board,
      stat: article ? trackerStat(board.metric, article) : undefined,
      updatedAt: updatedAt && Number.isFinite(Date.parse(updatedAt)) ? updatedAt : undefined,
    };
  });
});

export async function stories({ school, football, basketball, recruiting, category, titleContains, writerId, limit = 24 }: {
  school?: string; football?: boolean; basketball?: boolean; recruiting?: boolean; category?: string; titleContains?: string; writerId?: string; limit?: number | null;
} = {}): Promise<Article[]> {
  const db = editorialClient();
  const buildQuery = (withLabels: boolean) => {
    let query = db.from("articles").select("id,slug,title,excerpt,cover_image_url,category,school,published_at,is_top_story,writer_profile_id,byline:body->>author_name,cover_alt:body->>cover_alt,cover_caption:body->>cover_caption,author_name,is_sponsored" + (withLabels ? ",labels" : "")).or(publicArticles());
  if (school === "LSU") {
    // Legacy LSU coverage predates school tags. Include LSU headlines only when no school is set.
    query = query.or('school.ilike.lsu,body->>secondary_school.eq.LSU,and(or(school.is.null,school.eq.""),title.ilike.%LSU%)');
  } else if (school) query = query.or(`school.eq.${JSON.stringify(school)},body->>secondary_school.eq.${JSON.stringify(school)}`);
  if (football) query = query.in("category", footballCategories);
  if (basketball) query = query.or(`category.ilike.%basketball%,title.ilike.%basketball%,title.ilike.%CBB%,excerpt.ilike.%basketball%,excerpt.ilike.%CBB%,slug.in.(n,${legacyArticleSlug})`);
  if (category) query = query.eq("category", category);
  if (writerId) query = query.eq("writer_profile_id", writerId);
  if (titleContains) query = query.ilike("title", `%${titleContains}%`);
  if (recruiting) query = query.or("category.eq.Recruiting,school.eq.Recruiting").gte("published_at", new Date(Math.floor(Date.now() / 86400000) * 86400000 - 14 * 86400000).toISOString());
  return query.order("published_at", { ascending: false, nullsFirst: false }).order("id", { ascending: false });
  };
  let ordered = buildQuery(true);
  const rows: (Article & { byline?: string; author_name?: string; cover_alt?: string; cover_caption?: string })[] = [];
  const batch = limit ?? 500;
  for (let offset = 0; ; offset += batch) {
    let { data, error } = await ordered.range(offset, offset + batch - 1);
    if (offset === 0 && error?.code === "42703" && error.message.includes("labels")) {
      ordered = buildQuery(false);
      ({ data, error } = await ordered.range(offset, offset + batch - 1));
    }
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as typeof rows));
    if (limit !== null || !data || data.length < batch) break;
  }
  return attachWriters(db, rows.map(row => ({
    ...row,
    school: school === "LSU" ? school : row.school,
    body: { author_name: row.byline || row.author_name || undefined, cover_alt: row.cover_alt, cover_caption: row.cover_caption },
  })));
}

export async function basketballStories(limit: number | null = null) {
  const articles = await stories({ basketball: true, limit });
  return [...new Map(articles.filter(article => article.slug !== "n" || !articles.some(item => item.slug === legacyArticleSlug))
    .map(article => [articlePath(article.slug), article])).values()].map(article => ({
    ...article,
    category: article.category === "Recruiting" ? article.category : "College Basketball",
    conference: schoolByName(article.school)?.conference ?? (article.school === "Iowa State" ? "Big 12" : undefined),
  }));
}

export async function latestTvGuidePath() {
  const { data } = await editorialClient().from("articles").select("slug")
    .or(publicArticles())
    .or("title.ilike.%tv guide%,title.ilike.%tv schedule%,title.ilike.%television schedule%")
    .order("published_at", { ascending: false }).limit(1).maybeSingle();
  return data?.slug ? articlePath(data.slug) : null;
}

export async function breakingStories() {
  const { data } = await editorialClient().from("articles").select("slug,title")
    .or(publicArticles()).not("slug", "is", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false }).limit(8);
  return (data ?? []).filter(story => story.slug && story.title?.trim()).slice(0, 7);
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
