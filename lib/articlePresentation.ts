const headings = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|quot|#39|apos|ndash|mdash);/gi, entity =>
      ({ "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&ndash;": "–", "&mdash;": "—" })[entity.toLowerCase()] ?? entity)
    .replace(/\s+/g, " ").trim();
}

export function articlePresentation(html: string, excerpt?: string | null) {
  const matches = [...html.matchAll(headings)];
  const ranked = matches.flatMap(match => {
    const name = plainText(match[3]);
    const rank = name.match(/^#?(\d{1,2})\s*[:.)–—-]?\s+(.+)$/);
    return rank ? [{ match, number: Number(rank[1]), name: rank[2], anchor: `rank-${rank[1]}` }] : [];
  });
  const step = ranked[1]?.number - ranked[0]?.number;
  const ranks = ranked.length >= 3 && Math.abs(step) === 1 && ranked.every((item, index) =>
    item.number > 0 && item.number === ranked[0].number + index * step
  ) ? ranked : [];

  const quickAnswer = excerpt?.trim() || "";
  const firstRank = ranks[0]?.match.index;
  const intro = html.slice(0, firstRank ?? matches[0]?.index ?? html.length);
  const paragraphs = [...intro.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => plainText(match[1]));
  const methodology = paragraphs.find(text => /\b(?:criteria|rank(?:ed|ing)?|methodology|based on|evaluat)\b/i.test(text));
  const nuggets = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => plainText(match[1]).match(/^.+?[.!?](?=\s+[A-Z]|$)/)?.[0] ?? plainText(match[1]));
  const takeaways = [...new Set([quickAnswer, ...paragraphs, ...nuggets].filter(text => text.length > 10 && text.length <= 240))].slice(0, 4);

  let body = html;
  for (const { match, number, anchor } of [...ranks].reverse()) {
    const index = match.index!;
    const attributes = (match[2] as string).replace(/\s(?:id|class)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    const inner = (match[3] as string).replace(/^((?:\s|<[^>]+>)*)#?\d{1,2}\s*[:.)–—-]?\s+/i, "$1");
    const heading = `<h${match[1]}${attributes} id="${anchor}" class="ranked-heading"><span class="rank-badge">#${number}</span><span>${inner}</span></h${match[1]}>`;
    body = body.slice(0, index) + heading + body.slice(index + match[0].length);
  }
  if (ranks.length) body = body.replace(
    /<(p|div)\b([^>]*)>(\s*(?:<strong>|<b>)?(?:NFL line|Career stats|Potential résumé value):[^<]+(?:<\/strong>|<\/b>)?\s*)<\/\1>/gi,
    (_, tag, attrs, content) => `<${tag}${attrs.replace(/\sclass\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")} class="rank-stat">${content}</${tag}>`,
  );

  return { body, ranks, methodology: methodology || quickAnswer, takeaways };
}
