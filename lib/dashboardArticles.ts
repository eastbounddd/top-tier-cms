import type { SupabaseClient } from "@supabase/supabase-js";
import { dashboardDateBounds, dashboardTabs, DASHBOARD_PAGE_SIZE, type DashboardFilters } from "@/lib/dashboardFilters";
import { schools } from "@/lib/schools";
import type { StoryLabel } from "@/lib/storyLabels";

export type DashboardArticle = {
  id: string; title: string; slug: string; category: string; school: string | null;
  secondary_school: string | null; author_name: string | null; status: string;
  labels: StoryLabel[]; published_at: string | null; updated_at: string | null;
};

const articleColumns = "id,title,slug,category,school,secondary_school,author_name,status,labels,published_at,updated_at";
const sortColumns = {
  newest: "published_at", oldest: "published_at", updated: "updated_at",
  headline: "headline_sort", author: "author_sort", school: "school_sort",
} as const;
const sortableAscending = new Set(["oldest", "headline", "author", "school"]);

function filterArticles(db: SupabaseClient, filters: DashboardFilters, ownerId: string | undefined, count = false) {
  let query = db.from("dashboard_articles").select(count ? "id" : articleColumns, count ? { count: "exact", head: true } : {});
  if (ownerId) query = query.eq("author_id", ownerId);
  if (filters.q) {
    const literal = filters.q.replaceAll("*", "%").replace(/[\\%_]/g, "\\$&");
    const pattern = JSON.stringify("%" + literal + "%");
    query = query.or(`title.ilike.${pattern},slug.ilike.${pattern}`);
  }
  if (filters.school) {
    const school = schools.find(item => item.name === filters.school);
    const values = [...new Set([filters.school, school?.slug].filter(Boolean))];
    query = query.or(values.flatMap(value => ["school", "secondary_school"].map(column =>
      `${column}.ilike.${JSON.stringify(value)}`)).join(","));
  }
  if (filters.author.startsWith("profile:")) query = query.eq("writer_profile_id", filters.author.slice(8));
  if (filters.author.startsWith("name:")) {
    query = query.is("writer_profile_id", null).eq("author_name", filters.author.slice(5));
  }
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.label) query = query.contains("labels", [filters.label]);
  if (filters.partner) query = query.eq("is_partner", filters.partner === "yes");
  if (filters.featured) query = query.eq("is_top_story", filters.featured === "yes");
  const bounds = dashboardDateBounds(filters);
  if (bounds.from) query = query.gte("published_at", bounds.from);
  if (bounds.until) query = query.lt("published_at", bounds.until);
  return query;
}

export async function getDashboardArticles(db: SupabaseClient, filters: DashboardFilters, ownerId?: string) {
  let rows = filterArticles(db, filters, ownerId);
  if (filters.status !== "all") rows = rows.eq("status", filters.status);
  const offset = (filters.page - 1) * DASHBOARD_PAGE_SIZE;
  const [result, ...counts] = await Promise.all([
    rows.order(sortColumns[filters.sort], { ascending: sortableAscending.has(filters.sort), nullsFirst: false })
      .order("id", { ascending: false }).range(offset, offset + DASHBOARD_PAGE_SIZE - 1)
      .overrideTypes<DashboardArticle[], { merge: false }>(),
    ...dashboardTabs.map(([status]) => {
      const query = filterArticles(db, filters, ownerId, true);
      return status === "all" ? query : query.eq("status", status);
    }),
  ]);
  const error = result.error || counts.find(result => result.error)?.error;
  return { articles: result.data ?? [], counts: counts.map(result => result.count ?? 0), error };
}
