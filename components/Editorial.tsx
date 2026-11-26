import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/components/ArticleCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { articlePath, boards, editorialDate, itemList, schoolByName } from "@/lib/editorial";
import { schools } from "@/lib/schools";
import { schoolTheme } from "@/lib/schoolColors";
import { schemaJson } from "@/lib/structuredData";
import { writerImage, type Writer } from "@/lib/writers";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson(data) }} />;
}

export function LiveBoards({ id }: { id?: string }) {
  return <section className="live-boards" id={id}>
    <h2>Live Boards</h2>
    <ul>{boards.map(board => <li key={board.path}><Link href={board.path}><strong>{board.name}</strong><span>{board.detail}</span></Link></li>)}</ul>
    <JsonLd data={itemList("Live Boards", boards)} />
  </section>;
}

export function TeamGrid() {
  return <section className="editorial-section">
    <div className="editorial-heading"><h2>Find Your Team</h2><Link href="/schools">View all schools →</Link></div>
    <ul className="team-grid">{schools.map(school => <li key={school.slug} style={schoolTheme(school.slug)}>
      <Link href={`/schools/${school.slug}`}>{school.name}</Link>
    </li>)}</ul>
  </section>;
}

export function Story({ article, lead = false }: { article: Article; lead?: boolean }) {
  const school = schoolByName(article.school);
  const image = article.cover_image_url || "/top-tier-logo-optimized.webp";
  const path = articlePath(article.slug);
  const Heading = lead ? "h2" : "h3";
  return <article className={lead ? "editorial-story lead-story" : "editorial-story"}>
    <Link href={path} className="story-image" tabIndex={-1} aria-hidden="true">
      <Image src={image} alt={article.title} fill priority={lead} fetchPriority={lead ? "high" : undefined}
        sizes={lead ? "(max-width: 760px) 100vw, 720px" : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 360px"}
        unoptimized={image.startsWith("http") && !/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(image)} />
    </Link>
    <div className="story-copy">
      <span className="editorial-pill" style={schoolTheme(school?.slug)}>{article.school || article.category}</span>
      <Heading><Link href={path}>{article.title}</Link></Heading>
      {article.excerpt && <p>{article.excerpt}</p>}
      <div className="story-meta">
        {article.writer ? <Link href={`/author/${article.writer.slug}`}>{article.writer.name}</Link> : typeof article.body === "object" && article.body?.author_name}
        {article.published_at && <time dateTime={article.published_at}>{editorialDate(article.published_at)}</time>}
      </div>
    </div>
  </article>;
}

export function StoryGrid({ articles }: { articles: Article[] }) {
  return <div className="editorial-grid">{articles.map(article => <Story key={article.id} article={article} />)}</div>;
}

export function WritersStrip({ writers }: { writers: Writer[] }) {
  if (!writers.length) return null;
  return <section className="editorial-section">
    <div className="editorial-heading"><h2>Writers</h2><Link href="/writers">All writers →</Link></div>
    <div className="writers-strip">{writers.map(writer => <Link key={writer.id} href={`/author/${writer.slug}`}>
      <Image src={writerImage(writer)} width={44} height={44} alt="" unoptimized={/^https?:/i.test(writerImage(writer)) && !/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(writerImage(writer))} />
      <span><strong>{writer.name}</strong>{writer.coverage?.length ? <small>{writer.coverage.join(" · ")}</small> : null}</span>
    </Link>)}</div>
  </section>;
}

export function EditorialNewsletter() {
  return <div id="newsletter" className="editorial-newsletter"><NewsletterSignup variant="featured" /></div>;
}
