import { PublishButton } from "@/components/PublishButton";
import { canPublish } from "@/lib/articleWorkflow";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

const tabs = [
  ["all", "All Articles"], ["draft", "Draft"], ["ready_for_review", "Ready for Review"],
  ["scheduled", "Scheduled"], ["published", "Published"],
];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data, error }] = await Promise.all([
    db.from("profiles").select("display_name,role").eq("id", user.id).maybeSingle(),
    db.from("articles").select("id,title,slug,status,category,updated_at,published_at,author_id").order("updated_at", { ascending: false }),
  ]);
  const editor = canPublish(profile?.role);
  const status = (await searchParams).status || "all";
  const articles = (data || []).filter(article => editor || article.author_id === user.id).map(article => ({
    ...article,
    status: article.status === "pending_review" ? "ready_for_review" : article.status === "scheduled" &&
      Date.parse(article.published_at) <= Date.now() ? "published" : article.status,
  }));
  const visible = articles.filter(article => status === "all" || article.status === status);
  return <main id="main-content" className="dashboard">
    <aside><Image src="/top-tier-logo.png" alt="" width={120} height={120} /><nav>
      <Link href="/dashboard">Articles</Link><Link href="/dashboard/new">New Article</Link>
      {editor && <Link href="/dashboard/writers">Manage Writers</Link>}<Link href="/">View Website</Link>
    </nav><LogoutButton /></aside>
    <section className="dashboard-main">
      {editor && <nav className="dashboard-mobile-nav" aria-label="Dashboard navigation"><Link href="/dashboard/writers">Manage Writers</Link></nav>}
      <div className="dashboard-head"><div><small>TOP TIER CMS</small><h1>Welcome, {profile?.display_name}</h1><p>{profile?.role?.toUpperCase()}</p></div>
        <Link className="red-button" href="/dashboard/new">+ New Article</Link></div>
      <nav className="cms-status-tabs" aria-label="Filter articles">
        {tabs.map(([value, label]) => <Link key={value} aria-current={status === value ? "page" : undefined}
          href={value === "all" ? "/dashboard" : "/dashboard?status=" + value}>{label} ({articles.filter(a => value === "all" || a.status === value).length})</Link>)}
      </nav>
      <div className="panel"><h2>{tabs.find(([value]) => value === status)?.[1] || "Articles"}</h2>
        {error && <p role="alert">{error.message}</p>}
        <div className="article-table">{visible.map(article => <div className="cms-article-row" key={article.id}>
          <Link href={`/dashboard/new?id=${article.id}`}><div><b>{article.title}</b><span>{article.category} · {new Date(article.updated_at).toLocaleDateString()}</span></div>
            <em className={`status ${article.status}`}>{article.status.replaceAll("_", " ")}</em></Link>
          {editor && article.status === "ready_for_review" && <PublishButton id={article.id} />}
        </div>)}{!visible.length && !error && <p>No articles in this view.</p>}</div>
      </div>
    </section>
  </main>;
}
