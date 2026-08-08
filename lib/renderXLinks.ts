const xStatusUrlSource = String.raw`https?:\/\/(?:(?:www|mobile)\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+\/?(?:\?[^\s<"']*)?`;
const exactXStatusUrl = new RegExp(`^${xStatusUrlSource}$`, "i");

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const createEmbed = (url: string) => {
  const safeUrl = escapeAttribute(url.replace(/&amp;/g, "&"));
  return `<div class="x-post-embed"><blockquote class="twitter-tweet" data-dnt="true"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">View the original post on X</a></blockquote></div>`;
};

export function renderStandaloneXLinks(html: string) {
  const trimmed = html.trim();
  if (exactXStatusUrl.test(trimmed)) return createEmbed(trimmed);

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
