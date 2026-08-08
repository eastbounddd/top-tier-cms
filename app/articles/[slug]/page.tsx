import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { XEmbedContent } from "@/components/XEmbedContent";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.toptierstate.net";

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
  const image = data.cover_image_url || `${siteUrl}/top-tier-logo.png`;
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
          width: 1600,
          height: 900,
          alt: data.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description,
      images: [image],
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
  const image = data.cover_image_url || `${siteUrl}/top-tier-logo.png`;

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
          <div className="article-share-label">TOPTIERSTATE.NET</div>
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

        <XEmbedContent html={body} className="prose article-body" />
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
