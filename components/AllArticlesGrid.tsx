"use client";

import { useState } from "react";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 12;
const fields = "id,title,slug,excerpt,cover_image_url,category,school,published_at,is_top_story";

export function AllArticlesGrid({
  initialArticles,
  initialHasMore,
}: {
  initialArticles: Article[];
  initialHasMore: boolean;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("articles")
      .select(fields)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(articles.length, articles.length + PAGE_SIZE);

    if (queryError) {
      setError("Could not load more articles. Please try again.");
      setLoading(false);
      return;
    }

    const page = (data ?? []) as Article[];
    const nextArticles = page.slice(0, PAGE_SIZE);
    setArticles((current) => {
      const existing = new Set(current.map(({ id }) => id));
      return [...current, ...nextArticles.filter(({ id }) => !existing.has(id))];
    });
    setHasMore(page.length > PAGE_SIZE);
    setLoading(false);
  };

  return (
    <>
      {articles.length ? (
        <div className="news-grid">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              metaLabel={article.school || article.category}
            />
          ))}
        </div>
      ) : (
        <div className="school-empty">No articles have been published yet.</div>
      )}

      <div className="articles-load-more" aria-live="polite">
        {error && <p className="error">{error}</p>}
        {hasMore && (
          <button className="red-button" type="button" disabled={loading} onClick={loadMore}>
            {loading ? "Loading…" : "Load More"}
          </button>
        )}
      </div>
    </>
  );
}
