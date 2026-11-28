export const storyLabels = {
  BREAKING: "news happening right now",
  HOT: "trending story",
  EXCLUSIVE: "our own scoop or original reporting",
  INSIDER: "what we're hearing / scoops",
  PREVIEW: "pregame or matchup preview",
  RECAP: "game result or final",
  ANALYSIS: "deep breakdown",
  OPINION: "column or take",
  PARTNER: "sponsored or partner content (required for paid pieces)",
} as const;

export type StoryLabel = keyof typeof storyLabels;
export const isStoryLabel = (value: unknown): value is StoryLabel =>
  typeof value === "string" && Object.hasOwn(storyLabels, value);

type LabelStory = {
  title?: string;
  category?: string;
  labels?: unknown;
  published_at?: string | null;
  is_top_story?: boolean;
  is_sponsored?: boolean;
};

export function savedStoryLabels(article: LabelStory, sponsored = article.is_sponsored === true): StoryLabel[] {
  let labels: StoryLabel[];
  if (Array.isArray(article.labels)) labels = [...new Set(article.labels.filter(isStoryLabel))];
  else if (article.category === "Breaking News") labels = ["BREAKING"];
  else if (article.is_top_story && !/\bflip/i.test(article.title || "")) labels = ["HOT"];
  else labels = [];
  if (sponsored && !labels.includes("PARTNER")) labels = ["PARTNER", ...labels];
  return labels.slice(0, 2);
}

export function visibleStoryLabels(article: LabelStory, now: number, sponsored?: boolean) {
  const age = now - Date.parse(article.published_at || "");
  return savedStoryLabels(article, sponsored).filter(label => label !== "BREAKING" || (age >= 0 && age < 12 * 60 * 60 * 1000));
}
