import { StoryLabels } from "@/components/StoryLabels";
import { articleSponsorship, tagSponsoredLinks } from "@/lib/articleSponsorship";
import { articleCoverAlt } from "@/lib/articleCoverAlt";
import { writerPath } from "@/lib/writerPaths";
import { KeyTakeaways } from "@/components/KeyTakeaways";
import { withFollowPromo } from "@/lib/articleBlocks";
import { publicArticles } from "@/lib/articleWorkflow";
import { breadcrumbSchema, schemaJson } from "@/lib/structuredData";
import Link from "next/link";
import Image from "next/image";
import { attachWriters, writerXHandle } from "@/lib/writers";
import { WriterCard } from "@/components/WriterCard";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RenderedArticleContent } from "@/components/RenderedArticleContent";
import { ArticleShare } from "@/components/ArticleShare";
import { ArticleRecirculation } from "@/components/ArticleRecirculation";
import { PreferredSource } from "@/components/PreferredSource";
import { PreferredSourceButton } from "@/components/PreferredSourceButton";
import { EditorialNewsletter, JsonLd, LiveBoards, MoreStories, QuickJump, SchoolBeatCard } from "@/components/Editorial";
import { articlePath, editorialClient, editorialDate, itemList, legacyArticleSlug, schoolByName, stories } from "@/lib/editorial";
import { articlePresentation, authoredTakeaways, takeawayLead } from "@/lib/articlePresentation";
import { schoolTheme } from "@/lib/schoolColors";
import { getArticleImage, getSocialImageUrl, getXShareArticleUrl, siteUrl } from "@/lib/articleSocialImage";
import { coverWidth, coverHeight } from "@/lib/articleCover";

export const revalidate = 60;
export const dynamic = "force-static";
export const generateStaticParams = () => [];

const getArticle = cache(async (slug: string) => {
  const supabase = editorialClient();
  const lookup = (value: string) => supabase.from("articles").select("*").eq("slug", value).or(publicArticles()).maybeSingle();
  let { data, error } = await lookup(slug);
  if (!data && !error && slug === legacyArticleSlug) ({ data, error } = await lookup("n"));
  if (error) throw new Error(error.message);

  if (!data) return null;
  return (await attachWriters(supabase, [data]))[0];
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticle(slug);

  if (!data) {
    return {
      title: "Story Not Found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = siteUrl + articlePath(data.slug);
  const image = getArticleImage(data);
  const socialImage = getSocialImageUrl(data.slug, image);
  const imageAlt = articleCoverAlt(data);
  const description =
    data.excerpt?.replace(/[#\p{Extended_Pictographic}]/gu, "").replace(/\s+/g, " ").trim().slice(0,160) ||
    "Read the latest college football news, analysis and original reporting from Top Tier.";

  return {
    title: data.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      siteName: "Top Tier",
      title: data.title,
      description,
      url: canonical,
      publishedTime: data.published_at || undefined,
      modifiedTime: data.content_updated_at || data.updated_at || data.published_at || undefined,
      authors: [
        (typeof data.body === "object" && data.body?.author_name) ||
          data.writer?.name || data.author_name ||
          "Top Tier",
      ],
      section: data.category,
      images: [
        {
          url: socialImage,
          secureUrl: socialImage,
          alt: imageAlt,
          type: "image/png",
          width: coverWidth,
          height: coverHeight,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@TopTierStateX",
      title: data.title,
      description,
      images: [{ url: socialImage, secureUrl: socialImage, alt: imageAlt }],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getArticle((await params).slug);
  if (!data) notFound();

  const rawBody = (typeof data.body === "object" ? data.body?.html : data.body) || data.body_html || "";
  const { body, ranks, methodology, criteria, takeaways } = articlePresentation(rawBody, data.excerpt, authoredTakeaways(data.body));
  const writer = data.writer;
  const author = writer?.name || (typeof data.body === "object" && data.body?.author_name) || data.author_name || "Top Tier";
  const school = schoolByName(data.school);
  const schoolSlug = school?.slug || data.school?.trim().toLowerCase().replace(/\s+/g, "-");
  const beat = school;
  const taggedSchools = [...new Set([data.school, data.body?.secondary_school].filter((name): name is string =>
    typeof name === "string" && Boolean(name.trim())))];
  const handle = writer ? writerXHandle(writer) : null;
  const coverAlt = articleCoverAlt(data);
  const { sponsored, name: partnerName } = articleSponsorship(data);
  const articleHtml = withFollowPromo(body, data.body?.auto_follow === true);
  const football = { name: "College Football", path: "/college-football" };
  const topic = school ? { name: school.name, path: `/schools/${school.slug}` } :
    data.school === "Recruiting" || data.category === "Recruiting" ? { name: "Recruiting", path: "/recruiting" } :
    data.category === "College Basketball" ? { name: data.category, path: "/basketball" } :
    data.category === "College Football" ? football : { name: data.school || data.category || "Latest", path: "/articles" };
  const crumbs = topic.path === football.path ? [football] : [football, topic];
  const path = articlePath(data.slug);
  const canonical = siteUrl + path;
  const image = getArticleImage(data);
  const socialImage = getSocialImageUrl(data.slug, image);
  const published = data.published_at || undefined;
  const modified = data.content_updated_at || data.updated_at || published;
  const caption = typeof data.body?.cover_caption === "string" ? data.body.cover_caption : "";
  const credit = typeof data.body?.cover_credit === "string" ? data.body.cover_credit : "";

  const heisman = /\bheisman\b/i.test(data.title);
  const [schoolStories, topicStories, generalStories] = await Promise.all([
    beat ? stories({ school: beat.name, limit: 8 }) : Promise.resolve([]),
    heisman ? stories({ titleContains: "Heisman", limit: 8 }) : stories({ category: data.category, limit: 8 }),
    stories({ limit: 14 }),
  ]);
  const related = [...new Map([...schoolStories, ...topicStories, ...generalStories]
    .filter(story => articlePath(story.slug) !== path && story.id !== data.id)
    .map(story => [articlePath(story.slug), story])).values()];
  const relatedTitle = heisman ? "More Heisman & CFB" : `More ${beat?.name || data.category || "Stories"}`;
  const organization = { "@id": `${siteUrl}/#organization` };
  const news = {
    "@context": "https://schema.org", "@type": "NewsArticle",
    headline: data.title, description: data.excerpt || (takeaways[0] ? Object.values(takeawayLead(takeaways[0])).join("") : data.title),
    image: [{ "@type": "ImageObject", url: socialImage, width: coverWidth, height: coverHeight }],
    datePublished: published, dateModified: modified,
    author: [{ "@type": /^@?tops*tier/i.test(author) ? "Organization" : "Person", name: author, ...(writer ? { url: siteUrl + writerPath(writer.slug) } : {}) }],
    publisher: { "@type": "Organization", ...organization, name: "Top Tier Media" }, mainEntityOfPage: canonical,
    ...(taggedSchools.length ? { about: taggedSchools.map(name => ({ "@type": "Thing", name })), keywords: taggedSchools.join(", ") } : {}),
  };
  const rankLinks = ranks.map(({ anchor, number, name }) => <li key={anchor}><a href={`#${anchor}`}>#{number} <span>{name}</span></a></li>);

  return <>
    <Header />
    <main id="main-content" className="editorial editorial-article shell" style={schoolTheme(schoolSlug)}>
      <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link>{crumbs.map(crumb =>
        <span key={crumb.path}><span aria-hidden="true">/</span><Link href={crumb.path}>{crumb.name}</Link></span>)}</nav>
      <div className="editorial-article-grid">
        <article className="reading-column">
          <Link className="editorial-pill" href={topic.path}>{topic.name}</Link>

          <StoryLabels article={data} now={Date.now()} sponsored={sponsored} />
          <h1>{data.title}</h1>
          {sponsored && <p className="sponsored-disclosure"><strong>Partner content.</strong>{" "}
            {partnerName ? `This article is sponsored by ${partnerName}.` : "This article is sponsored."} Top Tier may earn a commission.
          </p>}
          {data.excerpt && <p className="editorial-dek">{data.excerpt}</p>}
          <div className="editorial-byline">
            <div>By {writer ? <Link href={writerPath(writer.slug)}>{author}</Link> : <strong>{author}</strong>}
              <div className="editorial-dates">
                {published && <span>Published <time dateTime={published}>{editorialDate(published, true)}</time></span>}
                {modified && modified !== published && <span>Updated <time dateTime={modified}>{editorialDate(modified, true)}</time></span>}
              </div>
            </div>
            <ArticleShare title={data.title} url={canonical} xUrl={getXShareArticleUrl(data.slug, image)} />
          </div>
          <PreferredSourceButton school={school} />
          {data.cover_image_url && <figure className="editorial-cover">
            <div className="article-cover-frame">
              <Image width={coverWidth} height={coverHeight} sizes="(max-width: 820px) 100vw, 700px"
                unoptimized={!/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(data.cover_image_url) && !data.cover_image_url.startsWith("/")}
                className="cover" src={data.cover_image_url} alt={coverAlt} priority fetchPriority="high" />
            </div>
            {(caption || credit) && <figcaption>{[caption, credit].filter(Boolean).join(" · ")}</figcaption>}
          </figure>}
          <KeyTakeaways bullets={takeaways} schoolAccent={Boolean(school)} />
          {ranks.length > 0 ? <>
            {(criteria.length > 0 || methodology) && <section className="takeaways"><h2>Ranking Criteria</h2>
              {criteria.length > 0 ? <ul>{criteria.map(text => <li key={text}>{text}</li>)}</ul> : <p>{methodology}</p>}
            </section>}
            <nav className="rank-jumps" aria-label="Jump to rank"><ul>{rankLinks}</ul></nav>
          </> : null}
          <RenderedArticleContent html={sponsored ? tagSponsoredLinks(articleHtml, partnerName, true) : articleHtml} className="prose editorial-prose" sponsored={sponsored} />
          {writer && <WriterCard writer={writer} />}
        </article>
        <aside className="editorial-rail">
          {ranks.length > 0 ? <QuickJump ranks={ranks} /> : beat && <SchoolBeatCard school={beat} hub={Boolean(school)} />}
          <LiveBoards />
          <MoreStories title={relatedTitle} articles={related.slice(5, 8)} />
        </aside>
      </div>
      <EditorialNewsletter article />
      {data.body?.preferred_source !== false && <PreferredSource />}
      <ArticleRecirculation articles={related.slice(0, 5)} />
    </main>
    <Footer newsletter={false} />
    <JsonLd data={[news, breadcrumbSchema([...crumbs, { name: data.title, path }]),
      ...(ranks.length ? [itemList("Ranking", ranks.map(rank => ({ name: rank.name, path: `${path}#${rank.anchor}` })))] : [])]} />
  </>;
}
