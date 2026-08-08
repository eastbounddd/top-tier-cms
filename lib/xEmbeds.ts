const xPostUrlSource =
  String.raw`https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+(?:\?[^\s<"']*)?`;

export const xPostUrlPattern = new RegExp(`^${xPostUrlSource}$`, "i");

export function createXEmbedHtml(url: string) {
  const safeUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<div class="x-embed"><blockquote class="twitter-tweet"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">View the original post on X</a></blockquote></div>`;
}

export function normalizeXEmbeds(html: string) {
  const linkedPost = new RegExp(
    `<p[^>]*>\\s*<a[^>]+href=["'](${xPostUrlSource})["'][^>]*>[\\s\\S]*?<\\/a>\\s*<\\/p>`,
    "gi"
  );
  const plainPost = new RegExp(
    `<p[^>]*>\\s*(${xPostUrlSource})\\s*(?:<br\\s*\\/?>)?\\s*<\\/p>`,
    "gi"
  );

  return html
    .replace(linkedPost, (_match, url: string) => createXEmbedHtml(url))
    .replace(plainPost, (_match, url: string) => createXEmbedHtml(url));
}
