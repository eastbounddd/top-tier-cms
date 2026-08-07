import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NetworkCarousel } from "@/components/NetworkCarousel";
import { UpcomingGames } from "@/components/UpcomingGames";
import { ArticleCard } from "@/components/ArticleCard";

const fallback = [
 { id:"1", slug:"welcome-to-top-tier", title:"Top Tier launches its new home for college football coverage", excerpt:"Breaking news, analysis and original reporting from across the Top Tier network.", category:"Breaking News", cover_image_url:"/top-tier-logo.png", is_top_story:true },
 { id:"2", slug:"network-expansion", title:"The Top Tier network expands across college football", excerpt:"Follow your favorite teams through dedicated Top Tier accounts.", category:"College Football", cover_image_url:"/top-tier-logo.png" },
 { id:"3", slug:"season-preview", title:"The stories that will define the college football season", excerpt:"The teams, players and coaching decisions to watch.", category:"Analysis", cover_image_url:"/top-tier-logo.png" }
];

export default async function Home() {
  let articles: any[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("articles").select("id,title,slug,excerpt,cover_image_url,category,published_at,is_top_story").eq("status","published").order("published_at",{ascending:false}).limit(18);
    articles = data ?? [];
  } catch {}
  if (!articles.length) articles = fallback;
  const top = articles.filter(a => a.is_top_story).concat(articles.filter(a => !a.is_top_story)).slice(0,5);
  const college = articles.filter(a => a.category !== "Other News").slice(0,8);
  const other = articles.filter(a => a.category === "Other News").slice(0,4);
  return <><Header/><main>
    <section className="hero"><iframe src="https://www.youtube.com/embed/-6bsfeicV9E?autoplay=1&mute=1&controls=0&loop=1&playlist=-6bsfeicV9E&modestbranding=1&rel=0&playsinline=1" title="Top Tier video" allow="autoplay; encrypted-media"/><div className="hero-shade"/><div className="shell hero-content"><small>COLLEGE FOOTBALL, ALL DAY</small><h1>STAY ON TOP OF<br/><em>COLLEGE FOOTBALL NEWS</em></h1><a href="#top-stories" className="red-button">Explore Top Stories →</a></div></section>
    <NetworkCarousel/><UpcomingGames/>
    <section id="top-stories" className="shell content-section"><div className="section-row"><div><small>RIGHT NOW</small><h2>Top Stories</h2></div></div><div className="top-grid">{top.map((a,i) => <ArticleCard key={a.id} article={a} featured={i===0}/>)}</div></section>
    <section id="college-football" className="dark-band"><div className="shell content-section"><div className="section-row"><div><small>THE DAILY HUDDLE</small><h2>College Football News</h2></div></div><div className="news-grid">{college.map(a => <ArticleCard key={a.id} article={a}/>)}</div></div></section>
    <section id="other-news" className="shell content-section"><div className="section-row"><div><small>AROUND THE SPORTS WORLD</small><h2>Other News</h2></div></div><div className="news-grid">{(other.length?other:articles.slice(0,4)).map(a => <ArticleCard key={a.id} article={a}/>)}</div></section>
  </main><Footer/></>;
}
