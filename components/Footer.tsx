"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Footer() {
  const [modal, setModal] = useState<"advertise" | "story" | null>(null);
  return <>
    <footer><div className="shell footer-grid">
      <div><Image src="/top-tier-logo.png" alt="Top Tier" width={170} height={170} className="footer-logo"/><p>Independent sports media built for fans who want the story before everyone else.</p></div>
      <div><h4>Coverage</h4><Link href="/#college-football">College Football</Link><Link href="/#other-news">Other News</Link></div>
      <div><h4>Company</h4><a href="#">About</a><button className="text-button" onClick={() => setModal("advertise")}>Advertise</button><a href="mailto:Partners@ttmediaco.net">Contact</a></div>
      <div><h4>Writers</h4><Link href="/login">Writer Login</Link><button className="text-button" onClick={() => setModal("story")}>Submit a Story</button></div>
    </div><div className="shell footer-bottom">© 2026 Top Tier. All rights reserved.<span>Built for the next headline.</span></div></footer>
    {modal && <div className="modal" onClick={() => setModal(null)}><div className="modal-card" onClick={e => e.stopPropagation()}><button className="modal-x" aria-label="Close" onClick={() => setModal(null)}>×</button>{modal === "advertise" ? <><small>ADVERTISE WITH TOP TIER</small><h2>Advertising Inquiries</h2><p>For all advertising inquiries, please email:</p><a href="mailto:partners@ttmediaco.net">partners@ttmediaco.net</a></> : <><small>SUBMIT A STORY</small><h2>Send Your Story to Top Tier</h2><p>Email your story, supporting details, photos and videos to:</p><a href="mailto:Partners@ttmediaco.net">Partners@ttmediaco.net</a></>}</div></div>}
  </>;
}
