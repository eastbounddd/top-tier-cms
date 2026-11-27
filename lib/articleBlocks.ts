export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function safeArticleUrl(value: string) {
  const url = value.trim();
  if (/^\/(?![/\\])[^\\\s]*$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
}

export type Promo = { title: string; subtitle: string; button: string; url: string; style: string; image?: string; kind?: string };
export const followPromo: Promo = {
  title: "Follow @TopTierStateX", subtitle: "Breaking college football news, rankings and lists all day.",
  button: "Follow", url: "https://x.com/TopTierStateX", style: "dark", kind: "main-x",
};

export function promoHtml(promo: Promo) {
  const url = safeArticleUrl(promo.url);
  if (!url || !promo.title.trim()) return "";
  const image = safeArticleUrl(promo.image || "");
  const style = ["dark", "light", "red"].includes(promo.style) ? promo.style : "light";
  return `<aside contenteditable="false" class="cms-promo cms-promo-${style}" data-promo-block="${escapeHtml(JSON.stringify(promo))}">${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">` : promo.kind?.endsWith("-x") ? '<span class="cms-promo-icon" aria-hidden="true">𝕏</span>' : ""}<div><strong>${escapeHtml(promo.title)}</strong><span>${escapeHtml(promo.subtitle)}</span></div><a href="${escapeHtml(url)}">${escapeHtml(promo.button)}</a></aside>`;
}

export function videoHtml(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { return ""; }
  if (url.protocol !== "https:") return "";
  const host = url.hostname.replace(/^www\./, "");
  const youtube = host === "youtube.com" ? (url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]) : host === "youtu.be" ? url.pathname.slice(1) : "";
  const instagram = host === "instagram.com" && url.pathname.match(/^\/(p|reel|tv)\/([\w-]+)\/?$/);
  const src = youtube && /^[\w-]{11}$/.test(youtube) ? `https://www.youtube-nocookie.com/embed/${youtube}` :
    instagram ? `https://www.instagram.com/${instagram[1]}/${instagram[2]}/embed/` : "";
  return src ? `<div contenteditable="false" class="cms-video${instagram ? " cms-instagram" : ""}"><iframe src="${src}" title="${instagram ? "Instagram post" : "YouTube video"}" loading="lazy" allowfullscreen></iframe><a href="${escapeHtml(url.href)}">View original</a></div>` : "";
}

export function withFollowPromo(html: string, enabled: boolean) {
  if (!enabled || /data-promo-block="[^"]*?main-x/.test(html)) return html;
  let paragraphs = 0;
  return html.replace(/<\/p\s*>/gi, end => ++paragraphs === 3 ? end + promoHtml(followPromo) : end);
}

