import Image from "next/image";
import Link from "next/link";

export function Header() {
  return <>
    <div className="breaking"><b>BREAKING</b><span>TOP TIER — COLLEGE FOOTBALL NEWS, ANALYSIS AND ORIGINAL REPORTING</span><i>● LIVE</i></div>
    <header className="header shell">
      <Link href="/" className="brand"><Image src="/top-tier-logo.png" alt="Top Tier" width={74} height={74} priority /></Link>
      <nav><Link href="/#top-stories">Top Stories</Link><Link href="/#college-football">College Football</Link><Link href="/#other-news">Other News</Link><a href="https://play.underdogsports.com/vgwg/p-ttm">Underdog</a></nav>
      <Link className="outline-button" href="/login">Writer Login</Link>
    </header>
  </>;
}
