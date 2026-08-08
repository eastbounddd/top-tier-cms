const xStatusUrlSource = String.raw`https?:\/\/(?:(?:www|mobile)\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+\/?(?:\?[^\s<"']*)?`;
const exactXStatusUrl = new RegExp(`^${xStatusUrlSource}$`, "i");

export const isXStatusUrl = (value: string) => exactXStatusUrl.test(value.trim());

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const createEmbed = (url: string) => {
  const safeUrl = escapeAttribute(url.replace(/&amp;/g, "&"));
  return `<div class="x-post-embed" data-x-url="${safeUrl}"><blockquote class="twitter-tweet" data-dnt="true"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">View the original post on X</a></blockquote></div>`;
};

export function renderStandaloneXLinks(html: string) {
  const trimmed = html.trim();
  if (isXStatusUrl(trimmed)) return createEmbed(trimmed);

  const rootLinkedPost = trimmed.match(
    new RegExp(`^<a[^>]+href=["'](${xStatusUrlSource})["'][^>]*>[\\s\\S]*?<\\/a>$`, "i")
  );
  if (rootLinkedPost) return createEmbed(rootLinkedPost[1]);

  const linkedBlock = new RegExp(
    `<(p|div)(?:\\s[^>]*)?>[\\s\\u00a0]*(?:&nbsp;)*<a[^>]+href=["'](${xStatusUrlSource})["'][^>]*>[\\s\\S]*?<\\/a>[\\s\\u00a0]*(?:&nbsp;)*<\\/\\1>`,
    "gi"
  );
  const plainBlock = new RegExp(
    `<(p|div)(?:\\s[^>]*)?>[\\s\\u00a0]*(?:&nbsp;)*(${xStatusUrlSource})[\\s\\u00a0]*(?:&nbsp;)*(?:<br\\s*\\/?>)?[\\s\\u00a0]*(?:&nbsp;)*<\\/\\1>`,
    "gi"
  );

  return html
    .replace(linkedBlock, (_match, _tag: string, url: string) => createEmbed(url))
    .replace(plainBlock, (_match, _tag: string, url: string) => createEmbed(url));
}

export type RenderedArticleSegment =
  | { type: "html"; html: string }
  | { type: "tweet"; url: string; tweetId: string; occurrence: number };

export function splitRenderedArticle(html: string): RenderedArticleSegment[] {
  const rendered = renderStandaloneXLinks(html);
  const embedPattern = /<div class="x-post-embed" data-x-url="([^"]+)">[\s\S]*?<\/blockquote><\/div>/gi;
  const segments: RenderedArticleSegment[] = [];
  const occurrences = new Map<string, number>();
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = embedPattern.exec(rendered))) {
    if (match.index > cursor) {
      segments.push({ type: "html", html: rendered.slice(cursor, match.index) });
    }
    const url = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const tweetId = url.match(/\/status\/(\d+)/i)?.[1] || url;
    const occurrence = occurrences.get(tweetId) || 0;
    occurrences.set(tweetId, occurrence + 1);
    segments.push({ type: "tweet", url, tweetId, occurrence });
    cursor = embedPattern.lastIndex;
  }

  if (cursor < rendered.length) {
    segments.push({ type: "html", html: rendered.slice(cursor) });
  }
  return segments.length ? segments : [{ type: "html", html: rendered }];
}
