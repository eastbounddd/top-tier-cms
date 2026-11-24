import { HeroVideo } from "@/components/HeroVideo";
import { pageMetadata } from "@/lib/pageMetadata";
export const metadata = { ...pageMetadata("College Football & Basketball News", "Independent college football and college basketball news, analysis, recruiting updates and original reporting from Top Tier.", "/"), title: { absolute: "Top Tier | College Football & Basketball News" } };
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NetworkCarousel } from "@/components/NetworkCarousel";
import { UpcomingGames } from "@/components/UpcomingGames";
import { ArticleCard } from "@/components/ArticleCard";
import Link from "next/link";
import { attachWriters } from "@/lib/writers";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export default async function Home() {
  let articles: any[] = [];
  let recruitingArticles: any[] = [];
  let basketballArticles: any[] = [];
  try {
    const supabase = await createClient();
    const currentFields = "*";
    const legacyFields = "*";
    const result = await supabase.from("articles").select(currentFields).eq("status","published").order("published_at",{ascending:false}).limit(24);

    // Continue showing published stories while the optional school migration
    // is waiting to be applied to an existing Supabase project.
    if (result.error) {
      const legacyResult = await supabase.from("articles").select(legacyFields).eq("status","published").order("published_at",{ascending:false}).limit(24);
      articles = (legacyResult.data ?? []).map((article) => ({ ...article, school: null }));
    } else {
      articles = result.data ?? [];

      const recruitingResult = await supabase
        .from("articles")
        .select(currentFields)
        .eq("status", "published")
        .eq("school", "Recruiting")
        .order("published_at", { ascending: false })
        .limit(8);
      recruitingArticles = recruitingResult.data ?? [];
    }
    const basketballResult = await supabase.from("articles").select("*").eq("status", "published").eq("category", "College Basketball").order("published_at", { ascending: false }).order("id", { ascending: false }).limit(8);
    basketballArticles = await attachWriters(supabase, basketballResult.data ?? []);
    articles = await attachWriters(supabase, articles);
    recruitingArticles = await attachWriters(supabase, recruitingArticles);
  } catch {}
  const used = new Set<string>();
  const take = (candidates: any[], limit: number) => candidates.filter(a => { return !used.has(a.id); }).slice(0, limit).map(a => { used.add(a.id); return a; });
  const top = take(articles.filter(a => a.is_top_story).concat(articles.filter(a => !a.is_top_story)), 5);
  const college = take(articles.filter(a => a.category !== "Other News" && a.category !== "College Basketball"), 8);
  const latestArticles = take(articles, 4);
  const other = take(articles.filter(a => a.category === "Other News"), 4);
  const schoolArticles = take(articles.filter(a => a.school && a.school !== "Recruiting"), 8);
  recruitingArticles = take(recruitingArticles, 8);
  return <><Header/><main id="main-content">
    <section className="hero"><HeroVideo/><div className="hero-shade"/><div className="shell hero-content"><h1>STAY ON TOP OF<br/><em>COLLEGE SPORTS</em></h1><a href="#top-stories" className="red-button">Explore Top Stories →</a></div></section>
    <NetworkCarousel/><UpcomingGames/>
    <section id="top-stories" className="shell content-section"><div className="section-row"><div><small>RIGHT NOW</small><h2>Top Stories</h2></div></div>{top.length?<div className="top-grid">{top.map((a,i) => <ArticleCard key={a.id} article={a} featured={i===0}/>)}</div>:<p className="muted">No stories have been published yet.</p>}</section>
    <div className="shell"><NewsletterSignup variant="featured" /></div>
    <section id="college-football" className="dark-band"><div className="shell content-section"><div className="section-row"><div><small>THE DAILY HUDDLE</small><h2>College Football News</h2></div></div>{college.length?<div className="news-grid">{college.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">No college football stories have been published yet.</p>}</div></section>
    {basketballArticles.length > 0 && <section className="shell content-section"><div className="section-row"><div><small>THE LATEST ON THE COURT</small><h2>College Basketball</h2></div><Link href="/college-basketball" className="red-button">View All ?</Link></div><div className="news-grid">{basketballArticles.map(a => <ArticleCard key={a.id} article={a} />)}</div></section>}
    <section className="shell content-section"><div className="section-row"><div><small>LATEST FROM TOP TIER</small><h2>All Articles</h2></div></div>{latestArticles.length?<div className="news-grid">{latestArticles.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">No articles have been published yet.</p>}<div className="section-action"><Link href="/articles" className="red-button">View All Articles →</Link></div></section>
    <section id="other-news" className="shell content-section"><div className="section-row"><div><small>AROUND THE SPORTS WORLD</small><h2>Other News</h2></div></div>{other.length?<div className="news-grid">{other.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">No other news stories have been published yet.</p>}</section>
    <section className="dark-band"><div className="shell content-section"><div className="section-row"><div><small>FROM OUR SCHOOL WRITERS</small><h2>School Coverage</h2></div><Link href="/schools" className="red-button">View All Schools →</Link></div>{schoolArticles.length?<div className="news-grid">{schoolArticles.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">School articles will appear here as they are published.</p>}</div></section>
    <section className="shell content-section"><div className="section-row"><div><small>THE LATEST PROSPECT NEWS</small><h2>Recruiting News</h2></div><Link href="/recruiting" className="red-button">View More Recruiting →</Link></div>{recruitingArticles.length?<div className="news-grid">{recruitingArticles.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">Recruiting stories will appear here as they are published.</p>}</section>
  </main><Footer/></>;
}
