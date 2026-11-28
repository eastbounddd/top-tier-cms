import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UpcomingGames } from "@/components/UpcomingGames";
import { NewsCard } from "@/components/NewsFeed";
import { EditorialNewsletter, JsonLd, LiveBoards, MoreStories, Story, StoryGrid, TeamGrid } from "@/components/Editorial";
import { articlePath, basketballStories, boards, stories, storyList } from "@/lib/editorial";
import { canLead, FOOTBALL_WINDOW_HOURS, LEAD_WINDOW_HOURS, rankStories, selectLead, storyCutoff } from "@/lib/storyRank";
import { pageMetadata } from "@/lib/pageMetadata";
import type { Article } from "@/components/ArticleCard";
import type { CSSProperties } from "react";

export const revalidate = 60;
export const dynamic = "force-static";
const headline = "Stay on top of college sports";
const subheading = "College sports news, analysis, and original reporting from Top Tier";
const homeMetadata = pageMetadata(headline, "Independent college sports news, analysis, recruiting updates and original reporting from Top Tier.", "/");
export const metadata = {
  ...homeMetadata,
  title: { absolute: headline },
  openGraph: { ...homeMetadata.openGraph, title: headline },
  twitter: { ...homeMetadata.twitter, title: headline },
};

export default async function Home() {
  // Reuse a single minute boundary for scores and cacheable query cutoffs.
  const now = Math.floor(Date.now() / 60_000) * 60_000;
  const leadSince = storyCutoff(now, LEAD_WINDOW_HOURS);
  const footballSince = storyCutoff(now, FOOTBALL_WINDOW_HOURS);
  const [articles, recruiting, basketball, recentLead, recentFootball] = await Promise.all([
    stories({ limit: 30 }),
    stories({ recruiting: true, limit: 5 }),
    basketballStories(5),
    stories({ publishedSince: leadSince, limit: null }),
    stories({ football: true, publishedSince: footballSince, limit: 40 }),
  ]);
  const hoops = basketball.slice(0, 4);
  const used = new Set([...boards.map(board => board.path), ...hoops.map(article => articlePath(article.slug))]);
  const candidates = articles.filter(article => !used.has(articlePath(article.slug)));
  const available = (article: Article) => !used.has(articlePath(article.slug));
  let lead = selectLead(recentLead.filter(available), now) ?? candidates.find(canLead);
  for (let offset = 30; !lead && articles.length === 30; offset += 30) {
    const page = await stories({ limit: 30, offset });
    lead = page.find(article => available(article) && canLead(article));
    if (page.length < 30) break;
  }
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
  const countAvailable = (pool: Article[]) => new Set(pool.filter(available).map(article => articlePath(article.slug))).size;
  // Load additional recent pages only if dedupe leaves the first batch short.
  let recentPage = recentFootball;
  for (let offset = 40; countAvailable(recentFootball) < 9 && recentPage.length === 40; offset += 40) {
    recentPage = await stories({ football: true, publishedSince: footballSince, limit: 40, offset });
    recentFootball.push(...recentPage);
  }
  const moreFootball = take(rankStories(recentFootball, now).map(({ article }) => article), 9);
  for (let offset = 0; moreFootball.length < 9; offset += 40) {
    const page = await stories({ football: true, publishedBefore: footballSince, limit: 40, offset });
    moreFootball.push(...take(page, 9 - moreFootball.length));
    if (page.length < 40) break;
  }
  const latest = take(candidates, 6);
  const recruits = take(recruiting, 2);
  return <>
    <Header />
    <main id="main-content" className="editorial shell">
      <h1 className="editorial-kicker home-audit-headline">{headline}</h1>
      <p className="home-audit-subheading">{subheading}</p>
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
