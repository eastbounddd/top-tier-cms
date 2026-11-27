import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UpcomingGames } from "@/components/UpcomingGames";
import { NewsCard } from "@/components/NewsFeed";
import { EditorialNewsletter, JsonLd, LiveBoards, MoreStories, Story, StoryGrid, TeamGrid } from "@/components/Editorial";
import { articlePath, basketballStories, boards, footballCategories, stories, storyList } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";
import type { Article } from "@/components/ArticleCard";
import type { CSSProperties } from "react";

export const revalidate = 60;
export const dynamic = "force-static";
const headline = "College sports news, analysis, and original reporting from Top Tier";
const homeMetadata = pageMetadata(headline, "Independent college sports news, analysis, recruiting updates and original reporting from Top Tier.", "/");
export const metadata = {
  ...homeMetadata,
  title: { absolute: headline },
  openGraph: { ...homeMetadata.openGraph, title: headline },
  twitter: { ...homeMetadata.twitter, title: headline },
};

export default async function Home() {
  const [articles, recruiting, basketball] = await Promise.all([stories({ limit: 30 }), stories({ recruiting: true, limit: 5 }), basketballStories(5)]);
  const hoops = basketball.slice(0, 4);
  const used = new Set([...boards.map(board => board.path), ...hoops.map(article => articlePath(article.slug))]);
  const candidates = articles.filter(article => !used.has(articlePath(article.slug)));
  const lead = candidates.find(article => article.is_top_story) ?? candidates[0];
  if (lead) used.add(articlePath(lead.slug));
  const take = (pool: Article[], count: number) => {
    const selected: Article[] = [];
    for (const article of pool) {
      const path = articlePath(article.slug);
      if (used.has(path)) continue;
      used.add(path);
      selected.push(article);
      if (selected.length === count) break;
    }
    return selected;
  };
  const secondary = take(candidates, 4);
  const moreFootball = take(candidates.filter(article => footballCategories.includes(article.category)), 9);
  const latest = take(candidates, 6);
  const recruits = take(recruiting, 2);
  return <>
    <Header />
    <main id="main-content" className="editorial shell">
      <h1 className="editorial-kicker">{headline}</h1>
      <div className="newsroom-grid home-hero">
        <section className="home-hero-lead" aria-label="Featured stories">
          {lead ? <Story article={lead} lead /> : <p>No stories have been published yet.</p>}
          {secondary.length > 0 && <div className="newsroom-feed home-secondary">
            {secondary.map(article => <NewsCard key={article.id} article={article} secondary />)}
          </div>}
        </section>
        <aside className="newsroom-rail"><LiveBoards id="live-boards" /><MoreStories title="More College Football" articles={moreFootball} expanded /></aside>
      </div>
      <UpcomingGames />
      <TeamGrid />
      <section className="editorial-section">
        <div className="editorial-heading"><h2>Latest News</h2><Link href="/articles">All articles →</Link></div>
        <StoryGrid articles={latest} />
      </section>
      {hoops.length > 0 && <section className="editorial-section basketball-band">
        <div className="editorial-heading"><h2>College Basketball</h2><Link href="/basketball">View All Basketball →</Link></div>
        <div className="newsroom-feed basketball-feed" style={{ "--basketball-count": hoops.length } as CSSProperties}>
          {hoops.map(article => <NewsCard key={article.id} article={article} basketballBand />)}
        </div>
      </section>}
        {recruits.length > 0 && <section className="editorial-section">
          <div className="editorial-heading"><h2>Recruiting</h2><Link href="/recruiting">More recruiting →</Link></div>
          <StoryGrid articles={recruits} />
        </section>}
      <EditorialNewsletter />
    </main>
    <Footer newsletter={false} />
    <JsonLd data={storyList("Latest Top Tier stories", [...(lead ? [lead] : []), ...secondary, ...moreFootball, ...latest, ...hoops])} />
  </>;
}
