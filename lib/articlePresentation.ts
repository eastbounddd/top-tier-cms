const headings = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;

export function normalizeArticleText(html: string) {
  return html.replace(/<[a-z][\w:-]*\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, tag =>
    tag.replace(/\s([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g,
      (attribute, key: string, doubleQuoted?: string, singleQuoted?: string, unquoted?: string) => {
        if (key.toLowerCase() === "color") return "";
        if (key.toLowerCase() !== "style") return attribute;
        const value = doubleQuoted ?? singleQuoted ?? unquoted;
        if (!value) return attribute;
        const styles = value.replace(/(^|;)\s*(?:color|-webkit-text-fill-color)\s*:[^;]*/gi, "$1")
          .replace(/^[;\s]+|[;\s]+$/g, "");
        const quote = singleQuoted !== undefined ? "'" : '"';
        return styles ? ` style=${quote}${styles}${quote}` : "";
      }),
  );
}

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|quot|#39|apos|ndash|mdash);/gi, entity =>
      ({ "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&ndash;": "–", "&mdash;": "—" })[entity.toLowerCase()] ?? entity)
    .replace(/\s+/g, " ").trim();
}

function textBlocks(html: string) {
  return [...html.matchAll(/<(p|div|li)\b[^>]*>((?:(?!<\/?(?:p|div|li)\b)[\s\S])*?)<\/\1>/gi)]
    .map(match => ({ text: plainText(match[2]), listItem: match[1].toLowerCase() === "li" }))
    .filter(block => block.text);
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
  const blocks = textBlocks(intro);
  const paragraphs = blocks.map(block => block.text);
  const criteriaLead = paragraphs.findIndex(text => /(?:criteria|methodology|went into the order|how we ranked).*:\s*$/i.test(text));
  const criteria = [];
  if (criteriaLead >= 0) {
    for (const block of blocks.slice(criteriaLead + 1, criteriaLead + 5)) {
      if (!block.listItem && !/^[-–—•]\s+/.test(block.text)) break;
      criteria.push(block.text.replace(/^[-–—•]\s+/, ""));
    }
  }
  const methodology = paragraphs.find(text => /\b(?:ranked by|ranking is based on|criteria|methodology|evaluated)\b/i.test(text));
  const nuggets = textBlocks(html).map(({ text }) => text.match(/^.+?[.!?](?=\s+[A-Z]|$)/)?.[0] ?? text);
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

  return { body: normalizeArticleText(body), ranks, methodology: methodology || quickAnswer, criteria, takeaways };
}
