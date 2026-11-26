import { breadcrumbSchema, schemaJson } from "@/lib/structuredData";
import Link from "next/link";
import Image from "next/image";
import { attachWriters } from "@/lib/writers";
import { WriterCard } from "@/components/WriterCard";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RenderedArticleContent } from "@/components/RenderedArticleContent";
import { ArticleShare } from "@/components/ArticleShare";
import { EditorialNewsletter, JsonLd, LiveBoards, MoreStories, QuickJump, SchoolBeatCard } from "@/components/Editorial";
import { articlePath, editorialClient, editorialDate, itemList, legacyArticleSlug, schoolByName, stories } from "@/lib/editorial";
import { articlePresentation } from "@/lib/articlePresentation";
import { schoolTheme } from "@/lib/schoolColors";
import { additionalSchoolBeats } from "@/lib/schools";
import { getArticleImage, getSocialImageUrl, getXShareArticleUrl, siteUrl } from "@/lib/articleSocialImage";
import { coverWidth, coverHeight } from "@/lib/articleCover";

export const revalidate = 60;
export const dynamic = "force-static";
export const generateStaticParams = () => [];

const getArticle = cache(async (slug: string) => {
  const supabase = editorialClient();
  const lookup = (value: string) => supabase.from("articles").select("*").eq("slug", value).eq("status", "published").maybeSingle();
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
          alt: data.title,
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
      images: [{ url: socialImage, secureUrl: socialImage, alt: data.title }],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getArticle((await params).slug);
  if (!data) notFound();

  const rawBody = (typeof data.body === "object" ? data.body?.html : data.body) || data.body_html || "";
  const { body, ranks, methodology, criteria, takeaways } = articlePresentation(rawBody, data.excerpt);
  const writer = data.writer;
  const author = writer?.name || (typeof data.body === "object" && data.body?.author_name) || data.author_name || "Top Tier";
  const school = schoolByName(data.school);
  const schoolSlug = school?.slug || data.school?.trim().toLowerCase().replace(/\s+/g, "-");
  const beat = school ?? additionalSchoolBeats.find(entry => entry.slug === schoolSlug);
  const football = { name: "College Football", path: "/college-football" };
  const topic = school ? { name: school.name, path: `/schools/${school.slug}` } :
    data.school === "Recruiting" || data.category === "Recruiting" ? { name: "Recruiting", path: "/recruiting" } :
    data.category === "College Basketball" ? { name: data.category, path: "/college-basketball" } :
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
  const [topicStories, generalStories] = await Promise.all([
    heisman ? stories({ titleContains: "Heisman", limit: 4 }) :
      beat ? stories({ school: beat.name, limit: 4 }) : stories({ category: data.category, limit: 4 }),
    stories({ football: data.category !== "College Basketball", limit: 8 }),
  ]);
  const related = [...new Map([...topicStories, ...generalStories].filter(story => story.id !== data.id).map(story => [story.id, story])).values()].slice(0, 3);
  const relatedTitle = heisman ? "More Heisman & CFB" : `More ${beat?.name || data.category || "Stories"}`;
  const organization = { "@id": `${siteUrl}/#organization` };
  const news = {
    "@context": "https://schema.org", "@type": "NewsArticle",
    headline: data.title, description: data.excerpt || undefined,
    image: [{ "@type": "ImageObject", url: socialImage, width: coverWidth, height: coverHeight }],
    datePublished: published, dateModified: modified,
    author: [{ "@type": /^@?tops*tier/i.test(author) ? "Organization" : "Person", name: author, ...(writer ? { url: `${siteUrl}/author/${writer.slug}` } : {}) }],
    publisher: organization, mainEntityOfPage: canonical,
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
          {data.is_sponsored && <p className="sponsored-disclosure">This article is sponsored content.</p>}
          <h1>{data.title}</h1>
          {data.excerpt && <p className="editorial-dek">{data.excerpt}</p>}
          <div className="editorial-byline">
            <div>By {writer ? <Link href={`/author/${writer.slug}`}>{author}</Link> : <strong>{author}</strong>}
              <div className="editorial-dates">
                {published && <span>Published <time dateTime={published}>{editorialDate(published, true)}</time></span>}
                {modified && modified !== published && <span>Updated <time dateTime={modified}>{editorialDate(modified, true)}</time></span>}
              </div>
            </div>
            <ArticleShare title={data.title} url={canonical} xUrl={getXShareArticleUrl(data.slug, image)} />
          </div>
          {data.cover_image_url && <figure className="editorial-cover">
            <div className="article-cover-frame">
              <Image width={coverWidth} height={coverHeight} sizes="(max-width: 820px) 100vw, 700px"
                unoptimized={!/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(data.cover_image_url) && !data.cover_image_url.startsWith("/")}
                className="cover" src={data.cover_image_url} alt={data.title} priority fetchPriority="high" />
            </div>
            {(caption || credit) && <figcaption>{[caption, credit].filter(Boolean).join(" · ")}</figcaption>}
          </figure>}
          {ranks.length > 0 ? <>
            {(criteria.length > 0 || methodology) && <section className="takeaways"><h2>Ranking Criteria</h2>
              {criteria.length > 0 ? <ul>{criteria.map(text => <li key={text}>{text}</li>)}</ul> : <p>{methodology}</p>}
            </section>}
            <nav className="rank-jumps" aria-label="Jump to rank"><ul>{rankLinks}</ul></nav>
          </> : takeaways.length > 0 && <section className="takeaways">
            <h2>{takeaways.length > 1 ? "Key Takeaways" : "Quick Answer"}</h2>
            <ul>{takeaways.map(text => <li key={text}>{text}</li>)}</ul>
          </section>}
          <RenderedArticleContent html={body} className="prose editorial-prose" />
          {writer && <WriterCard writer={writer} />}
        </article>
        <aside className="editorial-rail">
          {ranks.length > 0 ? <QuickJump ranks={ranks} /> : beat && <SchoolBeatCard school={beat} hub={Boolean(school)} />}
          <LiveBoards />
          <MoreStories title={relatedTitle} articles={related} />
        </aside>
      </div>
      <EditorialNewsletter />
    </main>
    <Footer newsletter={false} />
    <JsonLd data={[news, breadcrumbSchema([...crumbs, { name: data.title, path }]),
      ...(ranks.length ? [itemList("Ranking", ranks.map(rank => ({ name: rank.name, path: `${path}#${rank.anchor}` })))] : [])]} />
  </>;
}
