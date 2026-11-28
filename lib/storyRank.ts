import { articleSponsorship } from "@/lib/articleSponsorship";
import { visibleStoryLabels, type StoryLabel } from "@/lib/storyLabels";

const HOUR = 60 * 60 * 1000;
export const FRESHNESS_HALF_LIFE_HOURS = 12;
export const LEAD_WINDOW_HOURS = 72;
export const FEATURED_OVERRIDE_HOURS = 24;
export const FOOTBALL_WINDOW_HOURS = 14 * 24;
export const LABEL_BOOSTS: Readonly<Record<StoryLabel, number>> = {
  BREAKING: 1,
  EXCLUSIVE: 0.5,
  HOT: 0.4,
  INSIDER: 0.2,
  PREVIEW: 0.15,
  ANALYSIS: 0.15,
  RECAP: 0,
  OPINION: 0,
  PARTNER: 0,
};

type RankableStory = NonNullable<Parameters<typeof visibleStoryLabels>[0]> &
  Parameters<typeof articleSponsorship>[0];

export const storyCutoff = (now: number, hours: number) => new Date(now - hours * HOUR).toISOString();
const publishedTime = (article: RankableStory) => Date.parse(article.published_at || "");

function isWithin(article: RankableStory, now: number, hours: number) {
  const age = now - publishedTime(article);
  return age >= 0 && age <= hours * HOUR;
}

export const canLead = (article: RankableStory) =>
  !articleSponsorship(article).sponsored && !(Array.isArray(article.labels) && article.labels.includes("PARTNER"));

export function storyScore(article: RankableStory, now: number) {
  const age = now - publishedTime(article);
  if (!Number.isFinite(age) || age < 0) return 0;
  const freshness = 100 * 2 ** (-age / (FRESHNESS_HALF_LIFE_HOURS * HOUR));
  // An unset labels column can infer a HOT badge for legacy featured stories.
  // Keep that display fallback from turning an expired manual override into a boost.
  const labels = visibleStoryLabels({ ...article, is_top_story: false }, now);
  return freshness * (1 + labels.reduce((sum, label) => sum + LABEL_BOOSTS[label], 0));
}

export function rankStories<T extends RankableStory>(articles: T[], now: number) {
  return articles.map(article => ({ article, score: storyScore(article, now) })).sort((a, b) =>
    b.score - a.score || (publishedTime(b.article) || 0) - (publishedTime(a.article) || 0));
}

export function selectLead<T extends RankableStory>(articles: T[], now: number): T | undefined {
  const eligible = articles.filter(article => canLead(article) && isWithin(article, now, LEAD_WINDOW_HOURS));
  const featured = eligible.filter(article => article.is_top_story && isWithin(article, now, FEATURED_OVERRIDE_HOURS));
  if (featured.length) return [...featured].sort((a, b) => publishedTime(b) - publishedTime(a))[0];
  return rankStories(eligible, now)[0]?.article;
}
