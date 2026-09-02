"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return <>
    <div className="breaking"><b>BREAKING</b><span>TOP TIER — COLLEGE FOOTBALL NEWS, ANALYSIS AND ORIGINAL REPORTING</span><i>● LIVE</i></div>
    <header className="header shell">
      <Link href="/" className="brand"><Image src="/top-tier-logo.png" alt="Top Tier" width={74} height={74} priority /></Link>
      <nav><Link href="/#top-stories">Top Stories</Link><Link href="/schools">Schools</Link><Link href="/#college-football">College Football</Link><Link href="/#other-news">Other News</Link><Link href="/articles">All Articles</Link><Link href="/recruiting">Recruiting</Link><a href="https://play.underdogsports.com/vgwg/p-ttm">Underdog</a></nav>
      <Link className="outline-button" href="/login">Writer Login</Link>
      <button className="mobile-menu-button" type="button" aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
        <span /><span /><span />
      </button>
      {menuOpen && <nav id="mobile-navigation" className="mobile-menu" aria-label="Mobile navigation">
        <Link href="/#top-stories" onClick={() => setMenuOpen(false)}>Top Stories</Link>
        <Link href="/schools" onClick={() => setMenuOpen(false)}>Schools</Link>
        <Link href="/#college-football" onClick={() => setMenuOpen(false)}>College Football</Link>
        <Link href="/#other-news" onClick={() => setMenuOpen(false)}>Other News</Link>
        <Link href="/articles" onClick={() => setMenuOpen(false)}>All Articles</Link>
        <Link href="/recruiting" onClick={() => setMenuOpen(false)}>Recruiting</Link>
        <a href="https://play.underdogsports.com/vgwg/p-ttm" onClick={() => setMenuOpen(false)}>Underdog</a>
      </nav>}
    </header>
  </>;
}
