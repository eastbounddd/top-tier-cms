import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { JsonLd } from "@/components/Editorial";
import { NewsCard } from "@/components/NewsFeed";
import { articlePath, boards, itemList, stories } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata("Live Boards", "Follow Top Tier’s college football rankings, playoff, coaching, transfer portal, and recruiting trackers.", "/boards");
export const dynamic = "force-static";
export const revalidate = 60;

export default async function BoardsPage() {
  const articles = await stories({ limit: null });
  const filters = ["All Boards", "Playoff & Rankings", "Coaching Carousel", "Transfer Portal", "Recruiting"];
  const kinds = (title: string) => {
    if (/transfer portal/i.test(title)) return filters[3];
    if (/recruit|commit|flip/i.test(title)) return filters[4];
    if (/coaching|carousel/i.test(title)) return filters[2];
    return filters[1];
  };
  const tracked = articles.filter(article => /ranking|\btracker\b|\bboard\b|bubble watch|transfer portal/i.test(article.title));
  const pinned = new Set(boards.map(board => board.path));
  const all = [...boards, ...tracked.filter(article => !pinned.has(articlePath(article.slug))).slice(0, 12).map(article => ({
    name: article.title, detail: article.excerpt || article.category, path: articlePath(article.slug),
  }))];
  return <><Header /><main id="main-content" className="editorial shell newsroom-index">
    <section className="newsroom-heading"><small>Top Tier Live Trackers · Updated Daily</small><h1>Live Boards</h1><p>Follow the playoff picture, coaching changes, transfer portal news and recruiting.</p></section>
    <DirectoryExplorer filters={filters} gridClass="board-directory" entries={all.map(board => ({
      id: board.path, searchable: board.name, filters: [kinds(board.name)],
      card: <article className="directory-card board-directory-card"><span className="editorial-pill">{kinds(board.name)}</span><h2><Link href={board.path}>{board.name}</Link></h2><p>{board.detail}</p><Link href={board.path}>View Board →</Link></article>,
    }))} />
    <section className="editorial-section"><div className="editorial-heading"><h2>Recent Rankings &amp; Tracker Updates</h2></div><div className="newsroom-feed">{tracked.slice(0,6).map(article => <NewsCard article={article} key={article.id} />)}</div></section>
  </main><Footer /><JsonLd data={itemList("Top Tier Live Boards", all)} /></>;
}
