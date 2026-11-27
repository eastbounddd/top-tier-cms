export type TrackerMetric = "playoff" | "coaching" | "bowl";

type TrackerCopy = { title?: string | null; excerpt?: string | null; body?: unknown };

export function trackerStat(metric: TrackerMetric, { title, excerpt, body }: TrackerCopy) {
  const html = typeof body === "object" && body !== null && "html" in body ? body.html : body;
  const text = typeof html === "string" ? html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/\s+/g, " ") : "";
  const sources = [title ?? "", excerpt ?? "", text];

  // Match explicit totals in the published tracker. Missing or zero totals
  // are omitted rather than inferred from unrelated numbers in the article.
  const patterns: Record<TrackerMetric, RegExp> = {
    playoff: /\b(\d+)[-\s]+team\s+(?:CFP\s+)?bracket\b/i,
    coaching: /\b(\d+)\s+open\s+(?:in-season\s+)?(?:FBS\s+)?jobs?\b|\bopen\s+(?:in-season\s+)?jobs?\s*:\s*(\d+)\b/i,
    bowl: /\b(\d+)\s+(?:(?:college football|FBS)\s+)?(?:teams|programs)\s+are\s+(?:(?:already|now)\s+)?bowl eligible\b|\beligible\s+(?:teams|programs)\s*:\s*(\d+)\b/i,
  };
  const match = sources.map(source => source.match(patterns[metric])).find(Boolean);
  const count = match?.[1] || match?.[2];
  if (!count || Number(count) === 0) return undefined;
  if (metric === "playoff") return `${count}-team bracket`;
  if (metric === "coaching") return `${count} open ${count === "1" ? "job" : "jobs"}`;
  return `${count} eligible`;
}
