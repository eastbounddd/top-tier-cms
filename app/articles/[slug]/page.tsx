import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RenderedArticleContent } from "@/components/RenderedArticleContent";
import { ArticleShare } from "@/components/ArticleShare";

const siteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://toptierstate.net").replace(/\/$/, "");

function getPublicImageUrl(value: string | null | undefined) {
  const source = value?.trim() || "/top-tier-logo.png";

  if (source.startsWith("//")) return `https:${source}`;
  return new URL(source, `${siteUrl}/`).toString();
}

function getImageContentType(value: string) {
  const extension = new URL(value).pathname.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return undefined;
}

async function getArticle(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*,profiles(display_name,avatar_url)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  return data;
}

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
  const image = getPublicImageUrl(data.cover_image_url);
  const imageType = getImageContentType(image);
  const description =
    data.excerpt?.trim() ||
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
          url: image,
          alt: data.title,
          type: imageType,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description,
      images: [{ url: image, alt: data.title }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getArticle(slug);

  if (!data) notFound();

  const body =
    typeof data.body === "object" && data.body?.html
      ? data.body.html
      : String(data.body ?? "");

  const author =
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
  const image = getPublicImageUrl(data.cover_image_url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: data.title,
    description: data.excerpt || undefined,
    image: [image],
    datePublished: data.published_at || undefined,
    dateModified: data.updated_at || data.published_at || undefined,
    author: [{ "@type": "Person", name: author }],
    publisher: {
      "@type": "Organization",
      name: "Top Tier",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/top-tier-logo.png`,
      },
    },
    mainEntityOfPage: canonical,
  };

  return (
    <>
      <Header />

      <main className="article-page shell">
        <div className="article-kicker">{data.category}</div>
        <h1>{data.title}</h1>

        {data.excerpt && <p className="article-deck">{data.excerpt}</p>}

        <div className="article-info">
          <div className="byline">
            By <strong>{author}</strong>
          </div>
          {published && <div className="article-date">{published}</div>}
          <ArticleShare
            title={data.title}
            url={canonical}
          />
        </div>

        {data.cover_image_url && (
          <div className="article-cover-frame">
            <div
              className="article-cover-blur"
              style={{ backgroundImage: `url("${data.cover_image_url}")` }}
            />
            <img
              className="cover"
              src={data.cover_image_url}
              alt={data.title}
              fetchPriority="high"
            />
          </div>
        )}

        <RenderedArticleContent html={body} className="prose" />
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
