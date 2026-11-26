import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditorialNewsletter, JsonLd, LiveBoards, Story, StoryGrid, TeamGrid, WritersStrip } from "@/components/Editorial";
import { articlePath, stories, storyList } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";

export const revalidate = 60;
export const dynamic = "force-static";
export const metadata = { ...pageMetadata("College Football & Basketball News", "Independent college football and college basketball news, analysis, recruiting updates and original reporting from Top Tier.", "/"), title: { absolute: "Top Tier | College Football & Basketball News" } };

export default async function Home() {
  const [articles, recruiting] = await Promise.all([stories(), stories({ recruiting: true, limit: 5 })]);
  const lead = articles.find(article => article.is_top_story) ?? articles[0];
  const latest = articles.filter(article => article.id !== lead?.id).slice(0, 6);
  const used = new Set([lead?.id, ...latest.map(article => article.id)]);
  const recruits = recruiting.filter(article => !used.has(article.id)).slice(0, 2);
  const writers = [...new Map(articles.flatMap(article => article.writer ? [[article.writer.id, article.writer] as const] : [])).values()].slice(0, 4);
  return <>
    <Header breaking={lead ? { href: articlePath(lead.slug), text: lead.title } : undefined} />
    <main id="main-content" className="editorial shell">
      <h1 className="editorial-kicker">College football news, analysis, and original reporting from Top Tier</h1>
      <div className="newsroom-grid">
        {lead ? <Story article={lead} lead /> : <p>No stories have been published yet.</p>}
        <LiveBoards id="live-boards" />
      </div>
      <TeamGrid />
      <section className="editorial-section">
        <div className="editorial-heading"><h2>Latest</h2><Link href="/articles">All articles →</Link></div>
        <StoryGrid articles={latest} />
      </section>
      <div className={recruits.length ? "editorial-bottom-grid" : undefined}>
        {recruits.length > 0 && <section className="editorial-section">
          <div className="editorial-heading"><h2>Recruiting</h2><Link href="/recruiting">More recruiting →</Link></div>
          <StoryGrid articles={recruits} />
        </section>}
        <WritersStrip writers={writers} />
      </div>
      <EditorialNewsletter />
    </main>
    <Footer newsletter={false} />
    <JsonLd data={storyList("Latest Top Tier stories", lead ? [lead, ...latest] : latest)} />
  </>;
}
