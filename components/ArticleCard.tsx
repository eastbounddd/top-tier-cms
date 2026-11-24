import Link from "next/link";
import type { Writer } from "@/lib/writers";
export type Article = { id: string; title: string; slug: string; excerpt?: string | null; cover_image_url?: string | null; category: string; school?: string | null; published_at?: string | null; is_top_story?: boolean; writer_profile_id?: string | null; writer?: Writer; body?: { author_name?: string } | string | null };
export function ArticleCard({ article, featured = false, metaLabel }: { article: Article; featured?: boolean; metaLabel?: string }) {
 const image = article.cover_image_url || "/top-tier-logo.png";
 const date = article.published_at ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
 const author = article.writer?.name || (typeof article.body === "object" && article.body?.author_name);
 return <article className={featured ? "article-card featured" : "article-card"}>
  <Link href={`/articles/${article.slug}`} className="article-media" style={{ "--card-bg": `url("${image}")` } as React.CSSProperties} tabIndex={-1} aria-hidden="true"><img src={image} alt="" loading={featured ? "eager" : "lazy"}/></Link>
  <div className="article-copy"><div className="article-meta-row"><small>{metaLabel || article.category}</small>{date && <time>{date}</time>}</div>
   <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
   {author && <div className="card-byline">By {article.writer ? <Link className="writer-link" href={`/author/${article.writer.slug}`}>{author}</Link> : author}</div>}
   {article.excerpt && <p>{article.excerpt}</p>}<Link className="read-story" href={`/articles/${article.slug}`} tabIndex={-1} aria-hidden="true">Read Story →</Link>
  </div></article>;
}
