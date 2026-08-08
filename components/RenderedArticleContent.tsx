"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { renderStandaloneXLinks } from "@/lib/renderXLinks";

declare global {
  interface Window {
    twttr?: { widgets?: { load: (element?: HTMLElement) => Promise<unknown> } };
  }
}

export function RenderedArticleContent({ html, className }: { html: string; className: string }) {
  const container = useRef<HTMLElement>(null);
  const renderedHtml = useMemo(() => renderStandaloneXLinks(html), [html]);
  const hasXPosts = renderedHtml.includes('class="x-post-embed"');

  const loadXPosts = useCallback(() => {
    if (!hasXPosts || !container.current || !window.twttr?.widgets) return;
    void window.twttr.widgets.load(container.current).catch(() => undefined);
  }, [hasXPosts]);

  useEffect(() => {
    if (!hasXPosts) return;
    const timers = [0, 250, 750, 1500].map((delay) =>
      window.setTimeout(loadXPosts, delay)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [hasXPosts, loadXPosts, renderedHtml]);

  return (
    <>
      <article
        ref={container}
        className={className}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      {hasXPosts && (
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
