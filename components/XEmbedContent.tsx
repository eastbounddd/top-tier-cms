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
  const container = useRef<HTMLElement>(null);
  const statusTimers = useRef<number[]>([]);
  const normalizedHtml = useMemo(() => normalizeXEmbeds(html), [html]);

  const updateStatuses = useCallback((finalCheck = false) => {
    container.current?.querySelectorAll<HTMLElement>(".x-embed-wrapper").forEach((wrapper) => {
      const rendered = wrapper.querySelector("iframe, twitter-widget");
      if (rendered) {
        wrapper.classList.remove("x-embed-pending", "x-embed-failed");
        wrapper.classList.add("x-embed-loaded");
      } else if (finalCheck) {
        wrapper.classList.remove("x-embed-pending");
        wrapper.classList.add("x-embed-failed");
      }
    });
  }, []);

  const renderWidgets = useCallback(() => {
    const article = container.current;
    if (!article || !window.twttr?.widgets) return false;

    article.querySelectorAll<HTMLElement>(".x-embed-wrapper").forEach((wrapper) => {
      wrapper.classList.add("x-embed-pending");
    });
    void window.twttr.widgets.load(article).then(() => updateStatuses()).catch(() => undefined);
    return true;
  }, [updateStatuses]);

  useEffect(() => {
    statusTimers.current.forEach(window.clearTimeout);
    statusTimers.current = [];

    const loadAttempts = [0, 250, 750, 1500, 3000].map((delay) =>
      window.setTimeout(renderWidgets, delay)
    );
    const statusChecks = [500, 1500, 3000, 6000].map((delay) =>
      window.setTimeout(() => updateStatuses(delay === 6000), delay)
    );
    statusTimers.current = [...loadAttempts, ...statusChecks];

    return () => statusTimers.current.forEach(window.clearTimeout);
  }, [normalizedHtml, renderWidgets, updateStatuses]);

  return (
    <>
      <article
        ref={container}
        className={className}
        dangerouslySetInnerHTML={{ __html: normalizedHtml }}
      />
      <Script
        id="x-widgets"
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        onLoad={() => { renderWidgets(); }}
        onReady={() => { renderWidgets(); }}
      />
    </>
  );
}
