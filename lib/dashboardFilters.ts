import { chicagoDate } from "@/lib/articleWorkflow";
import { isStoryLabel } from "@/lib/storyLabels";

export const dashboardTabs = [
  ["all", "All Articles"], ["draft", "Draft"], ["ready_for_review", "Ready for Review"],
  ["scheduled", "Scheduled"], ["published", "Published"],
] as const;

export const dashboardSorts = [
  ["newest", "Newest published"], ["oldest", "Oldest published"], ["updated", "Recently updated"],
  ["headline", "Headline A–Z"], ["author", "Author A–Z"], ["school", "School A–Z"],
] as const;

export const DASHBOARD_PAGE_SIZE = 50;
export type DashboardQuery = Record<string, string | string[] | undefined>;

function dateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && chicagoDate(value + "T00:00") ? value : "";
}

export function dashboardFilters(query: DashboardQuery) {
  const read = (key: string, max = 160) => {
    const value = query[key];
    return typeof value === "string" ? value.trim().slice(0, max) : "";
  };
  const author = read("author");
  const flag = (key: string) => {
    const value = read(key);
    return value === "yes" || value === "no" ? value : "";
  };
  const page = Number(read("page"));
  const label = read("label");
  return {
    status: dashboardTabs.find(([key]) => key === read("status"))?.[0] || "all",
    sort: dashboardSorts.find(([key]) => key === read("sort"))?.[0] || "newest",
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1,
    q: read("q", 120),
    school: read("school"),
    author: /^profile:[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(author) ||
      /^name:.+/.test(author) ? author : "",
    category: read("category"),
    label: isStoryLabel(label) ? label : "",
    partner: flag("partner"),
    featured: flag("featured"),
    from: dateInput(read("from")),
    to: dateInput(read("to")),
  };
}

export type DashboardFilters = ReturnType<typeof dashboardFilters>;

export function dashboardHref(filters: DashboardFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && !(key === "status" && value === "all") &&
        !(key === "sort" && value === "newest") && !(key === "page" && value === 1)) {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return "/dashboard" + (query ? "?" + query : "");
}

export function dashboardDateBounds({ from, to }: DashboardFilters) {
  const nextDay = to ? new Date(Date.parse(to) + 24 * 3600_000).toISOString().slice(0, 10) : "";
  return {
    from: from ? chicagoDate(from + "T00:00") : null,
    until: nextDay ? chicagoDate(nextDay + "T00:00") : null,
  };
}
