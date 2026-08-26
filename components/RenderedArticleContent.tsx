"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { splitRenderedArticle } from "@/lib/renderXLinks";

type XWidgets = {
  load: (element?: HTMLElement) => Promise<unknown>;
  createTweet: (
    tweetId: string,
    element: HTMLElement,
    options?: Record<string, string | boolean>
  ) => Promise<HTMLElement | undefined>;
};

declare global {
  interface Window {
    twttr?: { widgets?: XWidgets };
  }
}

let xWidgetsPromise: Promise<XWidgets> | null = null;

function getXWidgets() {
  if (window.twttr?.widgets) return Promise.resolve(window.twttr.widgets);
  if (xWidgetsPromise) return xWidgetsPromise;

  xWidgetsPromise = new Promise<XWidgets>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.twitter.com/widgets.js"]'
    );
    const script = existing || document.createElement("script");
    const timeout = window.setTimeout(
      () => reject(new Error("X widgets timed out while loading.")),
      15000
    );

    const finish = () => {
      window.clearTimeout(timeout);
      if (window.twttr?.widgets) resolve(window.twttr.widgets);
      else reject(new Error("X widgets did not initialize."));
    };
    const fail = () => {
      window.clearTimeout(timeout);
      reject(new Error("X widgets failed to load."));
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });

    if (!existing) {
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    xWidgetsPromise = null;
    throw error;
  });

  return xWidgetsPromise;
}

const TweetEmbed = memo(function TweetEmbed({ url, tweetId }: { url: string; tweetId: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = wrapper.current;
    const mount = target.current;
    if (!element || !mount) return;
    let cancelled = false;

    void getXWidgets()
      .then((widgets) => widgets.createTweet(tweetId, mount, {
        dnt: true,
        align: "center",
        conversation: "none",
      }))
      .then((widget) => {
        if (!cancelled && widget) {
          element.classList.remove("x-post-embed-failed");
          element.classList.add("x-post-embed-loaded");
        }
      })
      .catch(() => {
        if (!cancelled) element.classList.add("x-post-embed-failed");
      });

    return () => {
      cancelled = true;
    };
  }, [tweetId]);

  return (
    <div ref={wrapper} className="x-post-embed">
      <div ref={target} className="x-post-widget-target" />
      <a className="x-post-fallback" href={url} target="_blank" rel="noopener noreferrer">
        View the original post on X
      </a>
    </div>
  );
});

export function RenderedArticleContent({ html, className }: { html: string; className: string }) {
  const container = useRef<HTMLElement>(null);
  const segments = useMemo(() => splitRenderedArticle(html), [html]);

  return (
    <article ref={container} className={className}>
      {segments.map((segment, index) =>
        segment.type === "tweet" ? (
          <TweetEmbed
            key={`tweet-${segment.tweetId}-${segment.occurrence}`}
            url={segment.url}
            tweetId={segment.tweetId}
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
