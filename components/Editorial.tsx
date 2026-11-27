import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/components/ArticleCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { XAccountLink } from "@/components/XAccountLink";
import { SchoolBeatAvatar } from "@/components/SchoolBeatAvatar";
import { StoryImage } from "@/components/StoryImage";
import { articlePath, editorialDate, itemList, liveTrackers, schoolByName } from "@/lib/editorial";
import { featuredSchoolCount, schools, type SchoolBeat } from "@/lib/schools";
import { schoolBannerLogo, schoolColors, schoolLogo, schoolTheme, schoolXAvatar } from "@/lib/schoolColors";
import { schemaJson } from "@/lib/structuredData";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson(data) }} />;
}

export function LiveStatusDot() {
  return <span className="boards-live-dot" aria-hidden="true" />;
}

export async function LiveBoards({ id, light = false }: { id?: string; light?: boolean }) {
  const trackers = await liveTrackers();
  return <section className={light ? "live-boards live-boards-light" : "live-boards"} id={id}>
    <div className="rail-heading"><h2><LiveStatusDot /> Live Boards</h2></div>
    <ul>{trackers.map(board => <li key={board.path}>
      <Link href={board.path} className="live-board-row">
        <div className="live-board-copy"><strong>{board.name}</strong><span className="live-board-description">{board.detail}</span>
          {board.stat && <span className="board-stat">{board.stat}</span>}
        </div>
        <span className="live-board-arrow" aria-hidden="true">{"\u2192"}</span>
      </Link>
    </li>)}</ul>
    <JsonLd data={itemList("Live Boards", trackers)} />
  </section>;
}

export function EditorialThumbnail({ article, className, sizes }: { article: Article; className: string; sizes: string }) {
  return <span className={`editorial-thumb ${className}`}><StoryImage src={article.cover_image_url} alt="" fill sizes={sizes} quality={85} /></span>;
}

export function MoreStories({ title, articles, expanded = false }: { title: string; articles: Article[]; expanded?: boolean }) {
  if (!articles.length) return null;
  let hot = 0;
  return <section className={`rail-card more-stories${expanded ? " more-stories-expanded" : ""}`}>
    <div className="rail-heading"><h2>{title}</h2>{expanded && <Link href="/college-football">View all →</Link>}</div>
    <ul>{articles.map(article => {
      const fresh = article.published_at && Date.now() - Date.parse(article.published_at) <= 48 * 60 * 60_000;
      const status = article.category === "Breaking News" ? "Breaking" : /\bflip/i.test(article.title) ? "Trending" :
        article.is_top_story && hot < 2 ? "Hot" : fresh ? "New" : "";
      if (status === "Hot") hot++;
      return <li key={article.id}><Link href={articlePath(article.slug)}>
        {expanded && <EditorialThumbnail article={article} className="rail-story-thumb" sizes="240px" />}
        <div>{expanded && status && <b className={`story-status status-${status.toLowerCase()}`}>{status}</b>}
          <strong>{article.title}</strong>{!expanded && <span>{article.school || article.category}</span>}</div>
      </Link></li>;
    })}</ul>
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

export function SchoolBadge({ school, size, alt = "", banner = false }: {
  school: SchoolBeat; size: 20 | 28 | 44; alt?: string; banner?: boolean;
}) {
  const colors = schoolColors(school.slug);
  const white = banner && colors.whiteBannerLogo;
  const logo = banner && !white ? schoolBannerLogo(school.slug) : schoolLogo(school.slug);
  return <span className={`school-badge badge-${size}${logo ? " school-badge-logo" : ""}${logo && white ? " school-badge-white" : ""}`} aria-hidden={logo && alt ? undefined : true}>
    {logo ? <Image src={logo} alt={alt} width={size} height={size} unoptimized /> : colors.abbr}
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
  return <section className="editorial-section compact-team-section">
    <div className="editorial-heading"><h2>Find Your Team</h2><Link href="/schools">View all {schools.length} →</Link></div>
    <ul className="team-grid compact-team-grid">{schools.slice(0, featuredSchoolCount).map(school => <li key={school.slug} style={schoolTheme(school.slug)}>
      <Link href={`/schools/${school.slug}`}><SchoolBadge school={school} size={20} />{school.name}</Link>
    </li>)}</ul>
  </section>;
}

export function Story({ article, lead = false, schoolLead = false }: { article: Article; lead?: boolean; schoolLead?: boolean }) {
  const school = schoolByName(article.school);
  const path = articlePath(article.slug);
  const Heading = lead ? "h2" : "h3";
  return <article className={schoolLead ? "editorial-story lead-story school-lead" : lead ? "editorial-story lead-story" : "editorial-story"}>
    <Link href={path} className="story-image" tabIndex={-1} aria-hidden="true">
      <StoryImage src={article.cover_image_url} alt={article.title} fill priority={lead} fetchPriority={lead ? "high" : undefined}
        sizes={lead ? "(max-width: 760px) 100vw, 720px" : "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 360px"} />
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

export function EditorialNewsletter({ article = false }: { article?: boolean }) {
  return <div id="newsletter" className="editorial-newsletter"><NewsletterSignup variant={article ? "article" : "featured"} /></div>;
}
