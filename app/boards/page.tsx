import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { JsonLd, LiveStatusDot } from "@/components/Editorial";
import { NewsCard } from "@/components/NewsFeed";
import { articlePath, editorialDate, itemList, liveTrackers, stories } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata("Live Boards", "Follow Top Tier’s live playoff, coaching and bowl eligibility trackers, plus college football rankings and analysis.", "/boards");
export const dynamic = "force-static";
export const revalidate = 60;

function rankingExcerpt(excerpt?: string | null) {
  const text = excerpt?.trim();
  // The CMS caps excerpts at 260 characters, including partially saved words.
  return text && text.length === 260 && !/[.!?\u2026]["'\u2019\u201d]?$/.test(text)
    ? text.replace(/\s+\S+$/, "\u2026")
    : text;
}

export default async function BoardsPage() {
  const [trackers, articles] = await Promise.all([liveTrackers(), stories({ limit: null })]);
  const trackerPaths = new Set<string>(trackers.map(tracker => tracker.path));
  const rankings = articles.filter(article => !trackerPaths.has(articlePath(article.slug)) &&
    (/\b(?:rankings?|ranking the|top \d+|countdown)\b/i.test(article.title) || article.category === "Analysis")).slice(0, 6);
  const filters = ["All Trackers", ...new Set(trackers.map(tracker => tracker.topic))];

  return <><Header /><main id="main-content" className="editorial shell newsroom-index">
    <section className="newsroom-heading"><h1>Live Boards</h1><p>Follow the playoff picture, coaching changes and bowl eligibility.</p></section>
    <section className="board-tracker-section" aria-labelledby="live-trackers">
      <div className="editorial-heading"><h2 id="live-trackers"><LiveStatusDot /> Live Trackers</h2></div>
      <DirectoryExplorer filters={filters} gridClass="board-directory" entries={trackers.map(board => ({
        id: board.path, searchable: board.name, filters: [board.topic],
        card: <article className="board-directory-card">
          <header className="board-tracker-header"><span>{board.topic}</span><span className="board-live-label">Live</span></header>
          <div className="board-tracker-content">
            <h3><Link href={board.path}>{board.name}</Link></h3>
            <p>{board.detail}</p>
            {(board.stat || board.updatedAt) && <div className="board-tracker-meta">
              {board.stat && <span className="board-stat">{board.stat}</span>}
              {board.updatedAt && <span>Updated <time dateTime={board.updatedAt}>{editorialDate(board.updatedAt)}</time></span>}
            </div>}
            <Link href={board.path} className="board-tracker-link" aria-label={`View board: ${board.name}`}>View Board <span aria-hidden="true">→</span></Link>
          </div>
        </article>,
      }))} />
    </section>
    {rankings.length > 0 && <section className="editorial-section" aria-labelledby="board-rankings">
      <div className="editorial-heading"><h2 id="board-rankings">Rankings &amp; Analysis</h2></div>
      <div className="newsroom-feed">{rankings.map(article => <NewsCard article={{ ...article, excerpt: rankingExcerpt(article.excerpt) }} key={article.id} />)}</div>
    </section>}
  </main><Footer /><JsonLd data={itemList("Top Tier Live Boards", trackers)} /></>;
}
