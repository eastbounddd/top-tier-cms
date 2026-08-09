"use client";

import { Facebook, Link as LinkIcon, X } from "lucide-react";
import { useState } from "react";

type ArticleShareProps = {
  title: string;
  url: string;
};

export function ArticleShare({ title, url }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}`;

  const shareOnFacebook = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(max-width: 700px), (pointer: coarse)").matches) {
      event.preventDefault();
      window.location.assign(facebookShareUrl);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="article-share" role="group" aria-label="Share article">
      <a
        className="article-share-icon"
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        data-tooltip="Share on X"
      >
        <X size={17} aria-hidden />
      </a>
      <a
        className="article-share-icon"
        href={facebookShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={shareOnFacebook}
        aria-label="Share on Facebook"
        data-tooltip="Share on Facebook"
      >
        <Facebook size={17} aria-hidden />
      </a>
      <button
        className="article-share-icon"
        type="button"
        onClick={copyLink}
        aria-label="Copy article link"
        data-tooltip="Copy link"
      >
        <LinkIcon size={17} aria-hidden />
      </button>
      <span className={`article-share-confirmation${copied ? " visible" : ""}`} role="status" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
