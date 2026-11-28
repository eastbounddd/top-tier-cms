const legacyPartners: Readonly<Record<string, string>> = {
  "pikkit-is-changing-the-way-sports-fans-track-their-bets": "Pikkit",
  "top-tier-x-underdog-sports": "Underdog",
};

export function articleSponsorship(article: { slug: string; is_sponsored?: boolean; body?: unknown }) {
  const legacyName = Object.hasOwn(legacyPartners, article.slug) ? legacyPartners[article.slug] : "";
  const body = article.body && typeof article.body === "object" ? article.body as Record<string, unknown> : {};
  const hasPartnerField = Object.hasOwn(body, "partner_name");
  const name = hasPartnerField && typeof body.partner_name === "string" ? body.partner_name.trim() : legacyName;
  return { sponsored: article.is_sponsored === true || (!hasPartnerField && Boolean(legacyName)), name };
}

function partnerLink(href: string, partner: string) {
  try {
    const url = new URL(href);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (["pikkit.com", "underdogsports.com", "underdogfantasy.com"].some(domain =>
      host === domain || host.endsWith("." + domain))) return true;
    const name = partner.toLowerCase().replace(/[^a-z0-9]/g, "");
    const labels = host.split(".");
    if (["uk", "au", "nz", "br"].includes(labels.at(-1) ?? "") && labels.at(-2) === "co") labels.pop();
    return Boolean(name && labels.at(-2)?.replaceAll("-", "") === name && !host.endsWith("toptierstate.net"));
  } catch {
    return false;
  }
}

export function tagSponsoredLinks(html: string, partner: string) {
  return html.replace(/<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, tag => {
    let href = "";
    let rel = "";
    const attributes = /\s([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g;
    for (const match of tag.matchAll(attributes)) {
      const value = match[2] ?? match[3] ?? match[4] ?? "";
      if (match[1].toLowerCase() === "href") href = value;
      if (match[1].toLowerCase() === "rel") rel = value;
    }
    if (!partnerLink(href, partner)) return tag;
    const tokens = [...new Set(["sponsored", "noopener", ...(rel.toLowerCase().match(/[a-z0-9_-]+/g) || [])])];
    return tag.replace(attributes, (attribute, key: string) => key.toLowerCase() === "rel" ? "" : attribute)
      .replace(/\s*\/?>$/, ` rel="${tokens.join(" ")}">`);
  });
}
