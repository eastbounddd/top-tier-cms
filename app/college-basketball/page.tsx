import { ArticleCard, type Article } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { pageMetadata } from "@/lib/pageMetadata";
import { createClient } from "@/lib/supabase/server";
import { attachWriters } from "@/lib/writers";

export const metadata = pageMetadata("College Basketball News & Analysis", "Follow college basketball news, analysis, recruiting updates and original reporting from Top Tier, covering teams and stories across the sport.", "/college-basketball");
export const dynamic = "force-dynamic";
export default async function CollegeBasketballPage() {
  const db = await createClient();
  const { data, error } = await db.from("articles").select("*").eq("status", "published").eq("category", "College Basketball").order("published_at", { ascending: false }).order("id", { ascending: false });
  const articles = await attachWriters(db, (data ?? []) as Article[]);
  return <><Header/><main id="main-content" className="schools-page shell"><div className="schools-heading"><small>TOP TIER COLLEGE BASKETBALL</small><h1>College Basketball</h1><p>The latest college basketball news, analysis and original reporting.</p></div>{error ? <p className="error">College basketball articles could not be loaded. Please try again later.</p> : articles.length ? <div className="news-grid">{articles.map(article => <ArticleCard key={article.id} article={article}/>)}</div> : <div className="school-empty">College basketball coverage is coming soon.</div>}</main><Footer/></>;
}
