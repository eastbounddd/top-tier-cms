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

export const takeawayMin = 3;
export const takeawayMax = 5;
export const takeawaySoftLimit = 160;

export function authoredTakeaways(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const values = "keyTakeaways" in body ? body.keyTakeaways : "takeaways" in body ? body.takeaways : null;
  return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string" && Boolean(value.trim())) : [];
}

export function takeawayLead(text: string) {
  const match = text.match(/^\*\*([^*]+)\*\*([\s\S]*)$/);
  return match ? { lead: match[1], rest: match[2] } : { lead: "", rest: text };
}

function extractTakeawayList(html: string) {
  const bullets: string[] = [];
  const body = html.replace(/<h2\b[^>]*>((?:(?!<\/?h2\b)[\s\S])*?)<\/h2>((?:\s|&nbsp;|<p[^>]*>\s*(?:<br\s*\/?>|&nbsp;)?\s*<\/p>)*)((?:<div\b[^>]*>\s*)?)<ul\b[^>]*>((?:(?!<ul\b)[\s\S])*?)<\/ul>(\s*<\/div>)?/gi,
    (section, heading: string, _gap: string, wrapper: string, list: string, closing?: string) => {
      if (!/^key takeaways\s*:?$/i.test(plainText(heading))) return section;
      const items = [...list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map(([, item]) => {
          const bold = item.match(/^\s*(?:<p\b[^>]*>\s*)?<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>([\s\S]*)$/i);
          if (!bold) return plainText(item);
          const lead = plainText(bold[2]);
          const rest = plainText(bold[3]);
          return lead ? "**" + lead + "**" + (rest && !/^[:;,.!?]/.test(rest) ? " " + rest : rest) : rest;
        }).filter(Boolean);
      if (!items.length) return section;
      bullets.push(...items);
      return wrapper ? (closing ? "" : wrapper) : (closing ?? "");
    });
  return { body, bullets };
}

const sentences = new Intl.Segmenter("en", { granularity: "sentence" });
const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu) || [];
const stripEllipses = (text: string) => text.trim().replace(/(?:\s*(?:\.{3,}|\u2026))+$/, "").trim();

function fallbackTakeaways(html: string, excerpt?: string | null) {
  const bullets: string[] = [];
  const keys = new Set<string>();
  const add = (text: string) => {
    const clean = stripEllipses(text);
    const tokens = words(clean);
    const key = tokens.join(" ");
    if (tokens.length < 6 || clean.length > 240 || keys.has(key)) return;
    keys.add(key);
    bullets.push(clean);
  };
  for (const { text } of textBlocks(html)) {
    for (const { segment } of sentences.segment(text)) {
      add(segment);
      if (bullets.length === 4) break;
    }
    if (bullets.length === 4) break;
  }
  if (excerpt) {
    const repeatsBullet = [...sentences.segment(excerpt)].some(({ segment }) => keys.has(words(stripEllipses(segment)).join(" ")));
    const count = bullets.length;
    if (!repeatsBullet) add(excerpt);
    if (bullets.length > count) bullets.unshift(bullets.pop()!);
  }
  return bullets.length >= 2 ? bullets.slice(0, 4) : [];
}

export function articlePresentation(html: string, excerpt?: string | null, authored: string[] = []) {
  const extracted = extractTakeawayList(html);
  html = extracted.body;
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
  const takeaways = authored.length ? authored : extracted.bullets.length ? extracted.bullets : fallbackTakeaways(html, excerpt);

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
