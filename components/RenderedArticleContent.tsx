"use client";

import { memo, useMemo } from "react";
import { splitRenderedArticle } from "@/lib/renderXLinks";

const TweetEmbed = memo(function TweetEmbed({
  url,
  tweetId,
  sponsored,
}: {
  url: string;
  tweetId: string;
  sponsored: boolean;
}) {
  const embedUrl = new URL("https://platform.twitter.com/embed/Tweet.html");
  embedUrl.searchParams.set("id", tweetId);
  embedUrl.searchParams.set("dnt", "true");
  embedUrl.searchParams.set("lang", "en");
  embedUrl.searchParams.set("theme", "light");
  embedUrl.searchParams.set("hideCard", "false");
  embedUrl.searchParams.set("hideThread", "false");

  return (
    <div className="x-post-embed x-post-direct-embed">
      <iframe
        className="x-post-frame"
        src={embedUrl.toString()}
        title="Embedded post on X"
        loading="lazy"
        scrolling="yes"
        allowFullScreen
      />
      <a
        className="x-post-source-link"
        href={url}
        target="_blank"
        rel={sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}
      >
        View post on X
      </a>
    </div>
  );
});

export function RenderedArticleContent({
  html,
  className,
  sponsored = false,
}: {
  html: string;
  className: string;
  sponsored?: boolean;
}) {
  const segments = useMemo(() => splitRenderedArticle(html), [html]);

  return (
    <article className={className}>
      {segments.map((segment, index) =>
        segment.type === "tweet" ? (
          <TweetEmbed
            key={`tweet-${segment.tweetId}-${segment.occurrence}`}
            url={segment.url}
            tweetId={segment.tweetId}
            sponsored={sponsored}
          />
        ) : (
          <div
            key={`html-${index}`}
            className="article-html-segment"
            dangerouslySetInnerHTML={{ __html: segment.html }}
          />
        )
      )}
    </article>
  );
}
