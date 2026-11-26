export const legacyArticleSlug = "no-such-thing-as-a-morale-victory-unless";

export const articlePath = (slug: string) => "/articles/" + encodeURIComponent(slug === "n" ? legacyArticleSlug : slug);
