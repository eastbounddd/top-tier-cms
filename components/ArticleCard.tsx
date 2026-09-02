import Link from "next/link";

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  category: string;
  school?: string | null;
  published_at?: string | null;
  is_top_story?: boolean;
};

export function ArticleCard({
  article,
  featured = false,
  metaLabel,
}: {
  article: Article;
  featured?: boolean;
  metaLabel?: string;
}) {
  const image = article.cover_image_url || "/top-tier-logo.png";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={featured ? "article-card featured" : "article-card"}
    >
      <div
        className="article-media"
        style={{ "--card-bg": `url("${image}")` } as React.CSSProperties}
      >
        <img
          src={image}
          alt={article.title}
          loading={featured ? "eager" : "lazy"}
        />
      </div>

      <div className="article-copy">
        <div className="article-meta-row">
          <small>{metaLabel || article.category}</small>
          {date && <time>{date}</time>}
        </div>

        <h3>{article.title}</h3>

        {article.excerpt && <p>{article.excerpt}</p>}

        <span>Read Story →</span>
      </div>
    </Link>
  );
}
