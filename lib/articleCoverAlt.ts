export function articleCoverAlt(article: { title: string; body?: unknown }) {
  if (article.body && typeof article.body === "object") {
    const body = article.body as Record<string, unknown>;
    for (const field of [body.cover_alt, body.cover_caption]) {
      if (typeof field === "string" && field.trim()) return field.trim();
    }
  }
  return article.title;
}
