"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { normalizeXEmbeds } from "@/lib/xEmbeds";

declare global {
  interface Window {
    twttr?: { widgets?: { load: (element?: HTMLElement) => Promise<unknown> } };
  }
}

export function XEmbedContent({ html, className }: { html: string; className: string }) {
  const container = useRef<HTMLDivElement>(null);
  const normalizedHtml = useMemo(() => normalizeXEmbeds(html), [html]);

  const renderWidgets = useCallback(() => {
    if (container.current && window.twttr?.widgets) {
      void window.twttr.widgets.load(container.current);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const timers = [0, 250, 750, 1500].map((delay) =>
      window.setTimeout(renderWidgets, delay)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [normalizedHtml, renderWidgets]);

  return (
    <>
      <div
        ref={container}
        className={className}
        dangerouslySetInnerHTML={{ __html: normalizedHtml }}
      />
      <Script
        id="x-widgets"
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        onLoad={renderWidgets}
      />
    </>
  );
}
