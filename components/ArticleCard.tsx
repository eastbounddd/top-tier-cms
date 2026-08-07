import Link from "next/link";

type Article = { id: string; title: string; slug: string; excerpt?: string | null; cover_image_url?: string | null; category: string; published_at?: string | null; is_top_story?: boolean };
export function ArticleCard({ article, featured=false }: { article: Article; featured?: boolean }) {
  return <Link href={`/articles/${article.slug}`} className={featured ? "article-card featured" : "article-card"}>
    <div className="article-image" style={{ backgroundImage: `linear-gradient(0deg,rgba(8,10,14,.9),rgba(8,10,14,.08)),url(${article.cover_image_url || "/top-tier-logo.png"})` }} />
    <div className="article-copy"><small>{article.category}</small><h3>{article.title}</h3>{!featured && article.excerpt && <p>{article.excerpt}</p>}<span>Read Story →</span></div>
  </Link>;
}
