import Link from "next/link";
import type { Article } from "@/components/ArticleCard";
import { EditorialThumbnail } from "@/components/Editorial";
import { articlePath, editorialDate } from "@/lib/editorial";

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
