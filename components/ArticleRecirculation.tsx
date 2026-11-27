import Link from "next/link";
import type { Article } from "@/components/ArticleCard";
import { EditorialThumbnail } from "@/components/Editorial";
import { articlePath, editorialDate } from "@/lib/editorial";

export function PreferredSource() {
  return <section className="preferred-source">
    <div><h2>See more Top Tier on Google</h2><p>Add Top Tier as a preferred source to get more of our college sports stories and scoops in your Google search results.</p></div>
    <a href="https://www.google.com/preferences/source?q=toptierstate.net" target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
        <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z"/>
        <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.5l-6.6-5.1a12.4 12.4 0 0 1-18.5-6.5H5.6v5.3A20 20 0 0 0 24 44z"/>
        <path fill="#FBBC05" d="M12.4 27.9a12 12 0 0 1 0-7.8v-5.3H5.6a20 20 0 0 0 0 18.4l6.8-5.3z"/>
        <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.2 19.2 0 0 0 24 4 20 20 0 0 0 5.6 14.8l6.8 5.3A12 12 0 0 1 24 12z"/>
      </svg>
      Add as preferred source
    </a>
  </section>;
}

function RelatedCard({ story, next = false }: { story: Article; next?: boolean }) {
  const author = story.writer?.name || (typeof story.body === "object" && story.body?.author_name);
  return <Link href={articlePath(story.slug)} className={`recirc-card${next ? " recirc-next-card" : ""}`}>
    <EditorialThumbnail article={story} className="recirc-thumb" sizes={next ? "(max-width: 639px) 100vw, 280px" : "280px"} />
    <div><small>{story.school || story.category}</small><strong>{story.title}</strong>
      <span>{[author, story.published_at ? editorialDate(story.published_at) : null].filter(Boolean).join(" · ")}</span></div>
    {next && <b className="recirc-next-cue" aria-hidden="true">⌄ Next</b>}
  </Link>;
}

export function ArticleRecirculation({ articles }: { articles: Article[] }) {
  const next = articles[4];
  return <>
    {articles.length > 0 && <section className="editorial-section recommendations">
      <div className="editorial-heading"><h2>Recommendations</h2><i>Curated by Top Tier</i></div>
      <div className="recommendations-grid">{articles.slice(0,4).map(story => <RelatedCard story={story} key={story.id} />)}</div>
    </section>}
    {next && <section className="editorial-section recirc-next">
      <div className="editorial-heading"><h2><span>Keep Scrolling</span> More from Top Tier</h2></div>
      <RelatedCard story={next} next />
    </section>}
  </>;
}
