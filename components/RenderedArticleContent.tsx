"use client";

import Script from "next/script";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { splitRenderedArticle } from "@/lib/renderXLinks";

declare global {
  interface Window {
    twttr?: { widgets?: { load: (element?: HTMLElement) => Promise<unknown> } };
  }
}

const TweetEmbed = memo(function TweetEmbed({ url }: { url: string }) {
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;

    const markLoaded = () => {
      if (element.querySelector("iframe, twitter-widget")) {
        element.classList.add("x-post-embed-loaded");
      }
    };
    const observer = new MutationObserver(markLoaded);
    observer.observe(element, { childList: true, subtree: true });
    markLoaded();
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="x-post-embed">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url} target="_blank" rel="noopener noreferrer">
          View the original post on X
        </a>
      </blockquote>
    </div>
  );
});

export function RenderedArticleContent({ html, className }: { html: string; className: string }) {
  const container = useRef<HTMLElement>(null);
  const segments = useMemo(() => splitRenderedArticle(html), [html]);
  const tweets = segments.filter((segment) => segment.type === "tweet");
  const tweetSignature = tweets.map(({ tweetId, occurrence }) => `${tweetId}:${occurrence}`).join("|");

  const loadXPosts = useCallback(() => {
    if (!tweetSignature || !container.current || !window.twttr?.widgets) return;
    void window.twttr.widgets.load(container.current).catch(() => undefined);
  }, [tweetSignature]);

  useEffect(() => {
    if (!tweetSignature) return;
    const timers = [0, 250, 750, 1500].map((delay) =>
      window.setTimeout(loadXPosts, delay)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [tweetSignature, loadXPosts]);

  return (
    <>
      <article ref={container} className={className}>
        {segments.map((segment, index) =>
          segment.type === "tweet" ? (
            <TweetEmbed
              key={`tweet-${segment.tweetId}-${segment.occurrence}`}
              url={segment.url}
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
      {tweetSignature && (
        <Script
          id="x-widgets"
          src="https://platform.twitter.com/widgets.js"
          strategy="afterInteractive"
          onLoad={() => { loadXPosts(); }}
          onReady={() => { loadXPosts(); }}
        />
      )}
    </>
  );
}
