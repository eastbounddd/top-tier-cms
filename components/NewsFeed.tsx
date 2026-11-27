"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Article } from "@/components/ArticleCard";
import { articlePath } from "@/lib/articlePaths";
import { StoryImage } from "@/components/StoryImage";

export function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const path = articlePath(article.slug);
  const author = article.writer?.name || (typeof article.body === "object" && article.body?.author_name);
  const Heading = featured ? "h2" : "h3";
  return <article className={`newsroom-card${featured ? " newsroom-featured" : ""}`}>
    <Link href={path} className="newsroom-photo" tabIndex={-1} aria-hidden="true">
      <StoryImage src={article.cover_image_url} alt={article.title} fill sizes={featured ? "(max-width: 767px) 100vw, 55vw" : "(max-width: 767px) 96px, 33vw"} priority={featured} />
    </Link>
    <div className="newsroom-copy">
      <div className="newsroom-meta"><b>{featured && "Featured · "}{article.category}</b>
        {article.published_at && <time dateTime={article.published_at}>{new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" }).format(new Date(article.published_at))}</time>}
      </div>
      <Heading><Link href={path}>{article.title}</Link></Heading>
      {article.excerpt && <p>{article.excerpt}</p>}
      <div className="newsroom-card-footer">
        {author && <span>By {article.writer ? <Link href={`/author/${article.writer.slug}`}>{author}</Link> : author}</span>}
        <Link href={path} tabIndex={-1} aria-hidden="true">{featured ? "Read Story →" : "Read →"}</Link>
      </div>
    </div>
  </article>;
}

const topics = ["All", "College Football", "Recruiting", "Rankings", "College Basketball", "Analysis"];
const recruitingTopics = ["All", "2027 Class", "2028 Class", "Flip Watch", "Commitments"];

function matchesTopic(article: Article, filter: string) {
  const text = `${article.title} ${article.excerpt ?? ""}`;
  switch (filter) {
    case "All": return true;
    case "Recruiting": return article.school === "Recruiting" || article.category === filter || /recruit|\bcommit|\bflip/i.test(text);
    case "Rankings": return /rank|\btop\s+\d|countdown/i.test(text);
    case "Analysis": return article.category === filter || /analysis|breakdown|what we learned|keys to/i.test(text);
    case "2027 Class": return /\b2027\b/.test(text);
    case "2028 Class": return /\b2028\b/.test(text);
    case "Flip Watch": return /\bflip/i.test(text);
    case "Commitments": return /\bcommit|signs with/i.test(text);
    default: return article.category === filter;
  }
}

export function NewsFeed({ articles, recruiting = false, rail }: { articles: Article[]; recruiting?: boolean; rail?: ReactNode }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [oldest, setOldest] = useState(false);
  const [limit, setLimit] = useState(13);
  const search = query.trim().toLowerCase();
  const matches = articles.filter(article => matchesTopic(article, filter) &&
    [article.title, article.excerpt, article.school, article.writer?.name, typeof article.body === "object" && article.body?.author_name]
      .filter(Boolean).join(" ").toLowerCase().includes(search));
  if (oldest) matches.reverse();
  const [lead, ...latest] = matches.slice(0, limit);
  const placeholder = recruiting ? "Search prospects, classes, or schools..." : "Search headlines, schools, or writers...";
  return <>
    <div className="directory-controls">
      <input type="search" value={query} placeholder={placeholder} aria-label={placeholder} onChange={event => { setQuery(event.target.value); setLimit(13); }} />
      <div className="filter-pills" aria-label="Topics">{(recruiting ? recruitingTopics : topics).map(topic =>
        <button key={topic} type="button" aria-pressed={topic === filter} onClick={() => { setFilter(topic); setLimit(13); }}>{topic}</button>,
      )}</div>
    </div>
    <div className="feed-controls"><span aria-live="polite">{matches.length} {matches.length === 1 ? "article" : "articles"}</span>
      <select aria-label="Sort articles" value={oldest ? "oldest" : "latest"} onChange={e => setOldest(e.target.value === "oldest")}><option value="latest">Latest</option><option value="oldest">Oldest</option></select>
    </div>
    <div className={rail ? "recruiting-layout" : undefined}>
      <div>{lead ? <NewsCard article={lead} featured /> : <p>No articles match your search.</p>}
        <div className="newsroom-feed">{latest.map(article => <NewsCard article={article} key={article.id} />)}</div>
        {matches.length > limit && <button className="newsroom-more" type="button" onClick={() => setLimit(n => n + 12)}>Load more articles</button>}
      </div>
      {rail}
    </div>
  </>;
}
