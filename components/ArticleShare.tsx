"use client";

import {
  Cloud,
  Copy,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  PinIcon,
  Printer,
  Share2,
  X as XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ArticleShareProps = {
  title: string;
  url: string;
  description: string;
  image: string;
};

type ShareOption = {
  label: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  href: string;
  direct?: boolean;
};

export function ArticleShare({ title, url, description, image }: ArticleShareProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLElement>(null);

  const text = `${title}\n${url}`;
  const facebookShareUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}`;
  const options: ShareOption[] = [
    { label: "Facebook", icon: Facebook, href: facebookShareUrl, direct: true },
    { label: "X / Twitter", icon: XIcon, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` },
    { label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: "Bluesky", icon: Cloud, href: `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}` },
    { label: "Reddit", icon: MessageCircle, href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` },
    { label: "Pinterest", icon: PinIcon, href: `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(description || title)}` },
  ];

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && dialog.current) {
        const focusable = Array.from(
          dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      triggerButton.current?.focus();
    };
  }, [open]);

  const openShareWindow = (href: string) => {
    setOpen(false);
    window.open(href, "article-share", "popup,noopener,noreferrer,width=720,height=640");
  };

  const shareOnFacebook = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);

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
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="article-share">
      <button ref={triggerButton} className="article-share-button" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <Share2 size={16} aria-hidden />
        Share
      </button>

      {open && (
        <div className="share-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section ref={dialog} className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
            <div className="share-dialog-head">
              <div>
                <small>SHARE THIS STORY</small>
                <h2 id="share-dialog-title">Choose a platform</h2>
              </div>
              <button ref={closeButton} className="share-close" type="button" onClick={() => setOpen(false)} aria-label="Close share menu">
                <XIcon size={20} aria-hidden />
              </button>
            </div>

            <div className="share-options">
              {options.map(({ label, icon: Icon, href, direct }) =>
                direct ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={shareOnFacebook} aria-label={`Share on ${label}`}>
                    <Icon size={19} aria-hidden />
                    <span>{label}</span>
                  </a>
                ) : (
                  <button key={label} type="button" onClick={() => openShareWindow(href)} aria-label={`Share on ${label}`}>
                    <Icon size={19} aria-hidden />
                    <span>{label}</span>
                  </button>
                )
              )}
              <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`}>
                <Mail size={19} aria-hidden />
                <span>Email</span>
              </a>
              <button type="button" onClick={copyLink} aria-label="Copy article link">
                <Copy size={19} aria-hidden />
                <span>{copied ? "Link copied" : "Copy Link"}</span>
              </button>
              <button type="button" onClick={() => { setOpen(false); window.print(); }} aria-label="Print article">
                <Printer size={19} aria-hidden />
                <span>Print</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
