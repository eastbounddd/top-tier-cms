import { StoryLabels } from "@/components/StoryLabels";
import { articleCoverAlt } from "@/lib/articleCoverAlt";
import { writerPath } from "@/lib/writerPaths";
import Link from "next/link";
import Image from "next/image";
import { articlePath } from "@/lib/articlePaths";
import type { Writer } from "@/lib/writers";
export type Article = { id: string; title: string; slug: string; excerpt?: string | null; cover_image_url?: string | null; category: string; school?: string | null; conference?: string; published_at?: string | null; is_top_story?: boolean; labels?: string[] | null; is_sponsored?: boolean; writer_profile_id?: string | null; writer?: Writer; body?: { author_name?: string; cover_alt?: string; cover_caption?: string; secondary_school?: string } | string | null };
export function ArticleCard({ article, featured = false, metaLabel }: { article: Article; featured?: boolean; metaLabel?: string }) {
 const image = article.cover_image_url || "/top-tier-logo.png";
 const path = articlePath(article.slug);
 const date = article.published_at ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
 const author = article.writer?.name || (typeof article.body === "object" && article.body?.author_name);
 return <article className={featured ? "article-card featured" : "article-card"}>
  <Link href={path} className="article-media" tabIndex={-1}><Image src={image} alt={articleCoverAlt(article)} fill sizes={featured ? "(max-width: 700px) 100vw, 60vw" : "(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw"} unoptimized={image.startsWith("http") && !/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(image)} /></Link>
  <div className="article-copy"><div className="article-meta-row"><small>{metaLabel || article.category}</small>{date && <time dateTime={article.published_at || undefined}>{date}</time>}</div>
   <StoryLabels article={article} now={Date.now()} />
   <h3><Link href={path}>{article.title}</Link></h3>
   {author && <div className="card-byline">By {article.writer ? <Link className="writer-link" href={writerPath(article.writer.slug)}>{author}</Link> : author}</div>}
   {article.excerpt && <p>{article.excerpt}</p>}<Link className="read-story" href={path} tabIndex={-1} aria-hidden="true">Read Story →</Link>
  </div></article>;
}
