import { articleSponsorship } from "@/lib/articleSponsorship";
import { visibleStoryLabels } from "@/lib/storyLabels";

export function StoryLabels({ article, now, sponsored }: {
  article: Parameters<typeof visibleStoryLabels>[0] & { slug?: string; body?: unknown }; now: number; sponsored?: boolean;
}) {
  const labels = visibleStoryLabels(article, now, sponsored ?? (article.slug ? articleSponsorship({ ...article, slug: article.slug }).sponsored : undefined));
  if (!labels.length) return null;
  return <span className="story-labels">{labels.map(label =>
    <span key={label} className={`story-label story-label-${label.toLowerCase()}`}>{label}</span>)}</span>;
}
