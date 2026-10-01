import { createHash } from "node:crypto";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.toptierstate.net"
).replace(/\/$/, "");

export function getArticleImage(article: { cover_image_url?: string | null; body?: unknown }) {
  const body = article.body;
  const html = typeof body === "string" ? body
    : body && typeof body === "object" && "html" in body && typeof body.html === "string"
      ? body.html : "";
  const bodyImages = Array.from(html.matchAll(/<img\b[^>]*?\ssrc\s*=\s*["']([^"']+)["'][^>]*>/gi),
    match => match[1].replace(/&amp;/g, "&"));

  for (const source of [article.cover_image_url, ...bodyImages, "/top-tier-logo.png"]) {
    if (!source?.trim()) continue;
    try {
      const url = new URL(source.trim(), `${siteUrl}/`);
      if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    } catch { /* Try the next available image. */ }
  }
  return `${siteUrl}/top-tier-logo.png`;
}

export function getSocialImageUrl(slug: string, image: string) {
  // Include the entire URL: folders and query parameters can identify replacements too.
  const version = createHash("sha256").update(image).digest("hex").slice(0, 20);
  return `${siteUrl}/social-images/${encodeURIComponent(slug)}?v=2-${version}`;
}
