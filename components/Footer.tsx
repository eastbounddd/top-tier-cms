"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { topTierLogo } from "@/lib/brand";

export function Footer({ newsletter = true }: { newsletter?: boolean }) {
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
    <footer className="editorial-footer">{newsletter && <div id="newsletter" className="shell"><NewsletterSignup variant="footer" /></div>}<div className="shell footer-grid">
      <div><Link href="/" className="editorial-footer-brand"><Image {...topTierLogo} alt="Top Tier" sizes="70px" /></Link><p>100% free college sports news, recruiting, and scoops. No paywalls, ever.</p><h2>Top Tier Media</h2><a href="https://x.com/TopTierStateX" target="_blank" rel="noopener noreferrer">X</a><a href="https://www.instagram.com/TopTierState">Instagram</a><a href="https://www.tiktok.com/@TopTierState">TikTok</a></div>
      <div><h2>Live Boards</h2><Link href="/boards">All live boards</Link></div>
      <div><h2>Coverage</h2><Link href="/college-football">College Football</Link><Link href="/college-basketball">College Basketball</Link><Link href="/recruiting">Recruiting</Link><Link href="/schools">Schools</Link></div>
      <div><h2>Company</h2><Link href="/about">About</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link><a href="mailto:partners@ttmediaco.net?subject=Advertising%20inquiry" onClick={e => { e.preventDefault(); trigger.current = e.currentTarget; setModal("advertise"); }}>Advertise</a><a href="mailto:partners@ttmediaco.net">Contact</a></div>
      <div><h2>Writers</h2><Link href="/writers">All Writers</Link><Link href="/login">Writer Login</Link><a href="mailto:partners@ttmediaco.net?subject=Story%20submission" onClick={e => { e.preventDefault(); trigger.current = e.currentTarget; setModal("story"); }}>Submit a Story</a></div>
    </div><div className="shell footer-bottom">© 2026 Top Tier. All rights reserved.<span>Built for the next headline.</span></div></footer>
    {modal && <div className="modal" onClick={() => setModal(null)}><div ref={dialog} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="footer-dialog-title" onClick={e => e.stopPropagation()}><button className="modal-x" aria-label="Close" onClick={() => setModal(null)}>×</button>{modal === "advertise" ? <><small>ADVERTISE WITH TOP TIER</small><h2 id="footer-dialog-title">Advertising Inquiries</h2><p>For all advertising inquiries, please email:</p><a href="mailto:partners@ttmediaco.net">partners@ttmediaco.net</a></> : <><small>SUBMIT A STORY</small><h2 id="footer-dialog-title">Send Your Story to Top Tier</h2><p>Email your story, supporting details, photos and videos to:</p><a href="mailto:partners@ttmediaco.net">partners@ttmediaco.net</a></>}</div></div>}
  </>;
}
