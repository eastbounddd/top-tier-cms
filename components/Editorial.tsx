import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/components/ArticleCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { XAccountLink } from "@/components/XAccountLink";
import { SchoolBeatAvatar } from "@/components/SchoolBeatAvatar";
import { articlePath, boards, editorialDate, itemList, schoolByName } from "@/lib/editorial";
import { schools, type SchoolBeat } from "@/lib/schools";
import { schoolColors, schoolLogo, schoolTheme, schoolXAvatar } from "@/lib/schoolColors";
import { schemaJson } from "@/lib/structuredData";
import { writerImage, type Writer } from "@/lib/writers";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson(data) }} />;
}

export function LiveBoards({ id, light = false }: { id?: string; light?: boolean }) {
  return <section className={light ? "live-boards live-boards-light" : "live-boards"} id={id}>
    <div className="rail-heading"><h2>Live Boards</h2><span className="board-updated">Updated daily</span></div>
    <ul>{boards.map(board => <li key={board.path}><Link href={board.path}><strong>{board.name}</strong><span>{board.detail}</span></Link></li>)}</ul>
    <JsonLd data={itemList("Live Boards", boards)} />
  </section>;
}

export function MoreStories({ title, articles }: { title: string; articles: Article[] }) {
  if (!articles.length) return null;
  return <section className="rail-card more-stories">
    <h2>{title}</h2>
    <ul>{articles.map(article => <li key={article.id}><Link href={articlePath(article.slug)}>
      <strong>{article.title}</strong><span>{article.school || article.category}</span>
    </Link></li>)}</ul>
  </section>;
}

export function QuickJump({ ranks }: { ranks: { anchor: string; number: number; name: string }[] }) {
  return <nav className="rail-card rank-rail" aria-label="Quick jump to rank">
    <h2>Quick Jump</h2>
    <ol>{ranks.map(({ anchor, number, name }) => {
      const parts = name.match(/^(.+?)(?:,\s*[a-z]{1,3})?,\s*([^,()]+)\s*\((\d{4}(?:(?:\s+and\s+|[–-])\d{4})?)\)$/i);
      return <li key={anchor}><a href={`#${anchor}`}>
        <span className="jump-number">#{number}</span><strong>{parts?.[1] ?? name}</strong>
        {parts && <span className="jump-meta">{parts[2].trim()} · {parts[3]}</span>}
      </a></li>;
    })}</ol>
  </nav>;
}

export function SchoolBadge({ school, size, alt = "" }: {
  school: SchoolBeat; size: 28 | 44; alt?: string;
}) {
  const logo = schoolLogo(school.slug);
  return <span className={`school-badge badge-${size}${logo ? " school-badge-logo" : ""}`} aria-hidden={logo && alt ? undefined : true}>
    {logo ? <Image src={logo} alt={alt} width={size} height={size} unoptimized /> : schoolColors(school.slug).abbr}
  </span>;
}

export function SchoolBeatCard({ school, hub = false }: { school: SchoolBeat; hub?: boolean }) {
  if (!school.xHandle && !hub) return null;
  return <section className="rail-card school-beat">
    <h2>{school.xHandle ? `Follow our ${school.name} beat on X` : `${school.name} coverage`}</h2>
    <div className="beat-identity">
      <SchoolBeatAvatar key={school.slug} src={schoolXAvatar(school.slug)} handle={school.xHandle} abbreviation={schoolColors(school.slug).abbr} />
      <div>{school.xHandle && <strong>@{school.xHandle}</strong>}<span>Top Tier {school.name}</span></div>
    </div>
    <p>Breaking news, recruiting, and gameday notes from the {school.name} beat.</p>
    {school.xHandle && <XAccountLink handle={school.xHandle} className="beat-follow" label="Follow on X →" />}
    {hub && <Link className="beat-hub-link" href={`/schools/${school.slug}`}>Visit the {school.name} hub</Link>}
  </section>;
}

export function TeamGrid() {
  return <section className="editorial-section">
    <div className="editorial-heading"><h2>Find Your Team</h2><Link href="/schools">View all schools →</Link></div>
    <ul className="team-grid">{schools.map(school => <li key={school.slug} style={schoolTheme(school.slug)}>
      <Link href={`/schools/${school.slug}`}><SchoolBadge school={school} size={28} alt={`${school.name} logo`} />{school.name}</Link>
    </li>)}</ul>
  </section>;
}

export function Story({ article, lead = false, schoolLead = false }: { article: Article; lead?: boolean; schoolLead?: boolean }) {
  const school = schoolByName(article.school);
  const image = article.cover_image_url || "/top-tier-logo-optimized.webp";
  const path = articlePath(article.slug);
  const Heading = lead ? "h2" : "h3";
  return <article className={schoolLead ? "editorial-story lead-story school-lead" : lead ? "editorial-story lead-story" : "editorial-story"}>
    <Link href={path} className="story-image" tabIndex={-1} aria-hidden="true">
      <Image src={image} alt={article.title} fill priority={lead} fetchPriority={lead ? "high" : undefined}
        sizes={lead ? "(max-width: 760px) 100vw, 720px" : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 360px"}
        unoptimized={image.startsWith("http") && !/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(image)} />
    </Link>
    <div className="story-copy">
      <span className="editorial-pill" style={schoolTheme(school?.slug)}>{schoolLead ? article.category : article.school || article.category}</span>
      <Heading><Link href={path}>{article.title}</Link></Heading>
      {article.excerpt && <p>{article.excerpt}</p>}
      <div className="story-meta">
        {article.writer ? <Link href={`/author/${article.writer.slug}`}>{article.writer.name}</Link> : typeof article.body === "object" && article.body?.author_name}
        {article.published_at && <time dateTime={article.published_at}>{editorialDate(article.published_at)}</time>}
        {schoolLead && article.school && <strong className="school-story-label">{article.school}</strong>}
      </div>
    </div>
  </article>;
}

export function SchoolStoryList({ articles }: { articles: Article[] }) {
  return <div className="school-story-list">{articles.map(article => <article key={article.id}>
    <small>{article.category}</small>
    <h3><Link href={articlePath(article.slug)}>{article.title}</Link></h3>
    <div className="story-meta">
      {article.writer ? <Link href={`/author/${article.writer.slug}`}>{article.writer.name}</Link> : typeof article.body === "object" && article.body?.author_name}
      {article.published_at && <time dateTime={article.published_at}>{editorialDate(article.published_at)}</time>}
    </div>
  </article>)}</div>;
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
