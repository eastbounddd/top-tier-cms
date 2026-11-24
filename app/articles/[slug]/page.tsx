import { breadcrumbSchema, schemaJson } from "@/lib/structuredData";
import Link from "next/link";
import Image from "next/image";
import { attachWriters } from "@/lib/writers";
import { WriterCard } from "@/components/WriterCard";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RenderedArticleContent } from "@/components/RenderedArticleContent";
import { ArticleShare } from "@/components/ArticleShare";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getArticleImage, getSocialImageUrl, getXShareArticleUrl, siteUrl } from "@/lib/articleSocialImage";
import { coverWidth, coverHeight } from "@/lib/articleCover";

// Published article metadata must reflect edits immediately, especially when
// a cover image is replaced after X has previously crawled the article URL.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const getArticle = cache(async (slug: string) => {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*,profiles(display_name,avatar_url)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

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

  const canonical = `${siteUrl}/articles/${data.slug}`;
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
      authors: [
        (typeof data.body === "object" && data.body?.author_name) ||
          (data.profiles as any)?.display_name ||
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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "n" && await getArticle("no-such-thing-as-a-morale-victory-unless")) permanentRedirect("/articles/no-such-thing-as-a-morale-victory-unless");
  const data = await getArticle(slug);

  if (!data) notFound();

  const body =
    typeof data.body === "object" && data.body?.html
      ? data.body.html
      : String(data.body ?? "");

  const writer = data.writer;
  const author = writer?.name ||
    (typeof data.body === "object" && data.body?.author_name) ||
    (data.profiles as any)?.display_name ||
    "Top Tier";
  const published = data.published_at
    ? new Date(data.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const canonical = `${siteUrl}/articles/${data.slug}`;
  const image = getArticleImage(data);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: data.title,
    description: data.excerpt || undefined,
    image: [image],
    datePublished: data.published_at || undefined,
    dateModified: data.content_updated_at || data.published_at || undefined,
    author: [{ "@type": /^@?tops*tier/i.test(author) ? "Organization" : "Person", name: author, ...(writer ? { url: `${siteUrl}/author/${writer.slug}` } : {}) }],
    publisher: {
      "@type": "Organization",
      name: "Top Tier",
      url: siteUrl,
      sameAs: ["https://x.com/TopTierStateX"],
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/top-tier-logo-optimized.webp`,
        width: 384, height: 384,
      },
    },
    mainEntityOfPage: canonical,
  };

  return (
    <>
      <Header />

      <main id="main-content" className="article-page shell">
        <div className="article-kicker">{data.is_sponsored ? "Sponsored" : data.category}</div>
        {data.is_sponsored && <p className="sponsored-disclosure">This article is sponsored content.</p>}
        <h1>{data.title}</h1>

        {data.excerpt && <p className="article-deck">{data.excerpt}</p>}

        <div className="article-info">
          <div className="byline">
            By <strong>{writer ? <Link className="writer-link" href={`/author/${writer.slug}`}>{author}</Link> : author}</strong>
          </div>
          {published && <time className="article-date" dateTime={data.published_at}>{published}</time>}
          <ArticleShare
            title={data.title}
            url={canonical}
            xUrl={getXShareArticleUrl(data.slug, image)}
          />
        </div>

        {data.cover_image_url && (
          <div className="article-cover-frame">

            <Image
              width={coverWidth}
              height={coverHeight}
              sizes="(max-width: 1040px) 100vw, 1040px"
              unoptimized={!/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(data.cover_image_url) && !data.cover_image_url.startsWith("/")}
              className="cover"
              src={data.cover_image_url}
              alt={data.title}
              priority
            />
          </div>
        )}

        <RenderedArticleContent html={body} className="prose" />
        {writer && <WriterCard writer={writer} />}
        <NewsletterSignup variant="article" />
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson([jsonLd, breadcrumbSchema([{name:"Articles",path:"/articles"},{name:data.title,path:`/articles/${data.slug}`}])]) }}
      />
    </>
  );
}
