import { DashboardFilterBar } from "@/components/DashboardFilterBar";
import { PublishButton } from "@/components/PublishButton";
import { articleCategories } from "@/lib/articleCategories";
import { canPublish } from "@/lib/articleWorkflow";
import { getDashboardArticles } from "@/lib/dashboardArticles";
import { dashboardFilters, dashboardHref, dashboardTabs, DASHBOARD_PAGE_SIZE, type DashboardQuery } from "@/lib/dashboardFilters";
import { schoolsAlphabetical, compareSchoolNames } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

const articleDate = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Chicago" });

export default async function Dashboard({ searchParams }: { searchParams: Promise<DashboardQuery> }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, params] = await Promise.all([
    db.from("profiles").select("display_name,role").eq("id", user.id).maybeSingle(),
    searchParams,
  ]);
  const editor = canPublish(profile?.role);
  const filters = dashboardFilters(params);
  const [{ articles, counts, error }, { data: writerProfiles }, { data: options, error: optionsError }] = await Promise.all([
    getDashboardArticles(db, filters, editor ? undefined : user.id),
    db.from("writer_profiles").select("id,name").order("name"),
    db.rpc("dashboard_article_options"),
  ]);
  const authors = [
    ...(writerProfiles ?? []).map(writer => ({ name: writer.name, value: "profile:" + writer.id, label: writer.name })),
    ...((options?.bylines ?? []) as string[]).map(name => ({ name, value: "name:" + name, label: name + " (plain-text byline)" })),
  ].sort(compareSchoolNames);
  const categories = [...new Set([...articleCategories, ...((options?.categories ?? []) as string[])])];
  const tab = dashboardTabs.find(([value]) => value === filters.status)!;
  const total = counts[dashboardTabs.indexOf(tab)];
  const pages = Math.max(1, Math.ceil(total / DASHBOARD_PAGE_SIZE));
  const start = (filters.page - 1) * DASHBOARD_PAGE_SIZE + 1;
  if (!error && filters.page > pages) redirect(dashboardHref({ ...filters, page: pages }));

  return <main id="main-content" className="dashboard">
    <aside><Image src="/top-tier-logo.png" alt="" width={120} height={120} /><nav>
      <Link href="/dashboard">Articles</Link><Link href="/dashboard/new">New Article</Link>
      {editor && <Link href="/dashboard/writers">Manage Writers</Link>}<Link href="/">View Website</Link>
    </nav><LogoutButton /></aside>
    <section className="dashboard-main">
      {editor && <nav className="dashboard-mobile-nav" aria-label="Dashboard navigation"><Link href="/dashboard/writers">Manage Writers</Link></nav>}
      <div className="dashboard-head"><div><small>TOP TIER CMS</small><h1>Welcome, {profile?.display_name}</h1><p>{profile?.role?.toUpperCase()}</p></div>
        <Link className="red-button" href="/dashboard/new">+ New Article</Link></div>
      <nav className="cms-status-tabs" aria-label="Filter articles by status">
        {dashboardTabs.map(([value, label], index) => <Link key={value} aria-current={filters.status === value ? "page" : undefined}
          href={dashboardHref({ ...filters, status: value, page: 1 })}>{label}{!error && ` (${counts[index]})`}</Link>)}
      </nav>
      <div className="panel">
        <h2>{tab[1]}</h2>
        <DashboardFilterBar filters={filters} authors={authors} categories={categories} schools={schoolsAlphabetical.map(school => school.name)} />
        {error && <p role="alert">{error.code === "PGRST205" ? "Apply the dashboard articles migration to load this list." : error.message}</p>}
        {!error && optionsError && <p role="alert">Some author and category options could not be loaded.</p>}
        {!error && <p className="cms-results-count" role="status">Showing {articles.length ? `${start}–${start + articles.length - 1}` : 0} of {total} articles</p>}
        <div className="article-table">{articles.map(article => {
          const schools = [...new Set([article.school, article.secondary_school].filter(Boolean))];
          const date = article.published_at || article.updated_at;
          return <div className="cms-article-row" key={article.id}>
            <Link href={`/dashboard/new?id=${article.id}`}><div>
              <b>{article.title}</b>
              <span className="cms-article-meta">
                {[article.category, schools.join(" / "), article.author_name].filter(Boolean).join(" · ")}
                {date && <> · {article.published_at ? "Published" : "Updated"} <time dateTime={date}>{articleDate.format(new Date(date))}</time></>}
              </span>
              {article.labels?.length > 0 && <div className="story-labels">{article.labels.map(label =>
                <b key={label} className={`story-label story-label-${label.toLowerCase()}`}>{label}</b>)}</div>}
            </div><em className={`status ${article.status}`}>{article.status.replaceAll("_", " ")}</em></Link>
            {editor && article.status === "ready_for_review" && <PublishButton id={article.id} />}
          </div>;
        })}{!articles.length && !error && <p>No articles match these filters.</p>}</div>
        {!error && pages > 1 && <nav className="cms-dashboard-pagination" aria-label="Article pages">
          {filters.page > 1 && <Link href={dashboardHref({ ...filters, page: filters.page - 1 })}>Previous</Link>}
          <span>Page {filters.page} of {pages}</span>
          {filters.page < pages && <Link href={dashboardHref({ ...filters, page: filters.page + 1 })}>Next</Link>}
        </nav>}
      </div>
    </section>
  </main>;
}
