"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export function Footer() {
  const [modal, setModal] = useState<"advertise" | "story" | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!modal) return;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setModal(null); }
      if (event.key === "Tab" && dialog.current) {
        const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); trigger.current?.focus(); };
  }, [modal]);
  return <>
    <footer><div className="shell"><NewsletterSignup variant="footer" /></div><div className="shell footer-grid">
      <div><Image src="/top-tier-logo-optimized.webp" alt="Top Tier" width={170} height={170} className="footer-logo"/><p>Independent sports media built for fans who want the story before everyone else.</p></div>
      <div><h2>Coverage</h2><Link href="/#college-football">College Football</Link><Link href="/#other-news">Other News</Link></div>
      <div><h2>Company</h2><Link href="/about">About</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link><a href="mailto:partners@ttmediaco.net?subject=Advertising%20inquiry" onClick={e => { e.preventDefault(); trigger.current = e.currentTarget; setModal("advertise"); }}>Advertise</a><a href="mailto:partners@ttmediaco.net">Contact</a></div>
      <div><h2>Writers</h2><Link href="/login">Writer Login</Link><a href="mailto:partners@ttmediaco.net?subject=Story%20submission" onClick={e => { e.preventDefault(); trigger.current = e.currentTarget; setModal("story"); }}>Submit a Story</a></div>
    </div><div className="shell footer-bottom">© 2026 Top Tier. All rights reserved.<span>Built for the next headline.</span></div></footer>
    {modal && <div className="modal" onClick={() => setModal(null)}><div ref={dialog} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="footer-dialog-title" onClick={e => e.stopPropagation()}><button className="modal-x" aria-label="Close" onClick={() => setModal(null)}>×</button>{modal === "advertise" ? <><small>ADVERTISE WITH TOP TIER</small><h2 id="footer-dialog-title">Advertising Inquiries</h2><p>For all advertising inquiries, please email:</p><a href="mailto:partners@ttmediaco.net">partners@ttmediaco.net</a></> : <><small>SUBMIT A STORY</small><h2 id="footer-dialog-title">Send Your Story to Top Tier</h2><p>Email your story, supporting details, photos and videos to:</p><a href="mailto:partners@ttmediaco.net">partners@ttmediaco.net</a></>}</div></div>}
  </>;
}
