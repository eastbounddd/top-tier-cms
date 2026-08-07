import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NetworkCarousel } from "@/components/NetworkCarousel";
import { UpcomingGames } from "@/components/UpcomingGames";
import { ArticleCard } from "@/components/ArticleCard";
import Link from "next/link";

export default async function Home() {
  let articles: any[] = [];
  try {
    const supabase = await createClient();
    const currentFields = "id,title,slug,excerpt,cover_image_url,category,published_at,is_top_story,school";
    const legacyFields = "id,title,slug,excerpt,cover_image_url,category,published_at,is_top_story";
    const result = await supabase.from("articles").select(currentFields).eq("status","published").order("published_at",{ascending:false}).limit(24);

    // Continue showing published stories while the optional school migration
    // is waiting to be applied to an existing Supabase project.
    if (result.error) {
      const legacyResult = await supabase.from("articles").select(legacyFields).eq("status","published").order("published_at",{ascending:false}).limit(24);
      articles = (legacyResult.data ?? []).map((article) => ({ ...article, school: null }));
    } else {
      articles = result.data ?? [];
    }
  } catch {}
  const top = articles.filter(a => a.is_top_story).concat(articles.filter(a => !a.is_top_story)).slice(0,5);
  const college = articles.filter(a => a.category !== "Other News").slice(0,8);
  const other = articles.filter(a => a.category === "Other News").slice(0,4);
  const schoolArticles = articles.filter(a => a.school).slice(0,8);
  return <><Header/><main>
    <section className="hero"><iframe src="https://www.youtube.com/embed/-6bsfeicV9E?autoplay=1&mute=1&controls=0&loop=1&playlist=-6bsfeicV9E&modestbranding=1&rel=0&playsinline=1" title="Top Tier video" allow="autoplay; encrypted-media"/><div className="hero-shade"/><div className="shell hero-content"><small>COLLEGE FOOTBALL, ALL DAY</small><h1>STAY ON TOP OF<br/><em>COLLEGE FOOTBALL NEWS</em></h1><a href="#top-stories" className="red-button">Explore Top Stories →</a></div></section>
    <NetworkCarousel/><UpcomingGames/>
    <section id="top-stories" className="shell content-section"><div className="section-row"><div><small>RIGHT NOW</small><h2>Top Stories</h2></div></div>{top.length?<div className="top-grid">{top.map((a,i) => <ArticleCard key={a.id} article={a} featured={i===0}/>)}</div>:<p className="muted">No stories have been published yet.</p>}</section>
    <section id="college-football" className="dark-band"><div className="shell content-section"><div className="section-row"><div><small>THE DAILY HUDDLE</small><h2>College Football News</h2></div></div>{college.length?<div className="news-grid">{college.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">No college football stories have been published yet.</p>}</div></section>
    <section id="other-news" className="shell content-section"><div className="section-row"><div><small>AROUND THE SPORTS WORLD</small><h2>Other News</h2></div></div>{other.length?<div className="news-grid">{other.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">No other news stories have been published yet.</p>}</section>
    <section className="dark-band"><div className="shell content-section"><div className="section-row"><div><small>FROM OUR SCHOOL WRITERS</small><h2>School Coverage</h2></div><Link href="/schools" className="red-button">View All Schools →</Link></div>{schoolArticles.length?<div className="news-grid">{schoolArticles.map(a => <ArticleCard key={a.id} article={a}/>)}</div>:<p className="muted">School articles will appear here as they are published.</p>}</div></section>
  </main><Footer/></>;
}
