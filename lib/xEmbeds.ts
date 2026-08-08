const xPostUrlSource = String.raw`https?:\/\/(?:(?:www|mobile)\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+\/?(?:\?[^\s<"']*)?`;

export const xPostUrlPattern = new RegExp(`^${xPostUrlSource}$`, "i");

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const decodeAttribute = (value: string) =>
  value.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

export function createXEditorBlockHtml(url: string) {
  const safeUrl = escapeAttribute(url);
  return `<div class="x-embed-editor-block" contenteditable="false" data-x-url="${safeUrl}"><strong>X post</strong><span>${safeUrl}</span></div>`;
}

export function createXEmbedHtml(url: string) {
  const safeUrl = escapeAttribute(url);
  return `<div class="x-embed-wrapper" data-x-url="${safeUrl}"><blockquote class="twitter-tweet"><a class="x-embed-fallback" href="${safeUrl}" target="_blank" rel="noopener noreferrer">View the original post on X</a></blockquote><span class="x-embed-loading">Loading post…</span></div>`;
}

export function prepareXEmbedsForEditor(html: string) {
  const renderedEmbed = new RegExp(
    `<div[^>]*class=["'][^"']*(?:x-embed-wrapper|x-embed)[^"']*["'][^>]*>[\\s\\S]*?<a[^>]+href=["'](${xPostUrlSource})["'][^>]*>[\\s\\S]*?<\\/a>[\\s\\S]*?<\\/div>`,
    "gi"
  );

  return html.replace(renderedEmbed, (_match, url: string) =>
    createXEditorBlockHtml(decodeAttribute(url))
  );
}

export function normalizeXEmbeds(html: string) {
  const editorBlock = new RegExp(
    `<div[^>]*class=["'][^"']*x-embed-editor-block[^"']*["'][^>]*data-x-url=["'](${xPostUrlSource})["'][^>]*>[\\s\\S]*?<\\/div>`,
    "gi"
  );
  const legacyEmbed = new RegExp(
    `<div[^>]*class=["'][^"']*x-embed[^"']*["'][^>]*>[\\s\\S]*?<a[^>]+href=["'](${xPostUrlSource})["'][^>]*>[\\s\\S]*?<\\/a>[\\s\\S]*?<\\/div>`,
    "gi"
  );
  const linkedPost = new RegExp(
    `<p[^>]*>\\s*<a[^>]+href=["'](${xPostUrlSource})["'][^>]*>[\\s\\S]*?<\\/a>\\s*<\\/p>`,
    "gi"
  );
  const plainPost = new RegExp(
    `<p[^>]*>\\s*(${xPostUrlSource})\\s*(?:<br\\s*\\/?>)?\\s*<\\/p>`,
    "gi"
  );

  return html
    .replace(editorBlock, (_match, url: string) => createXEmbedHtml(decodeAttribute(url)))
    .replace(legacyEmbed, (_match, url: string) => createXEmbedHtml(decodeAttribute(url)))
    .replace(linkedPost, (_match, url: string) => createXEmbedHtml(decodeAttribute(url)))
    .replace(plainPost, (_match, url: string) => createXEmbedHtml(decodeAttribute(url)));
}
