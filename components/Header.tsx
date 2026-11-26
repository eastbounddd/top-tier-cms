import Link from "next/link";
import Image from "next/image";
import { topTierLogo } from "@/lib/brand";
import { BreakingBar } from "@/components/BreakingBar";
import { MobileNavigation } from "@/components/MobileNavigation";

const links = [
  ["/articles", "Latest"], ["/college-football", "College Football"],
  ["/college-football#live-boards", "Boards"], ["/schools", "Schools"],
  ["/recruiting", "Recruiting"], ["/writers", "Writers"],
] as const;

export function Header() {
  return <>
    <header className="editorial-header">
      <div className="shell editorial-nav">
        <Link href="/" className="editorial-brand"><Image {...topTierLogo} alt="Top Tier" sizes="50px" priority /></Link>
        <nav className="editorial-desktop-nav" aria-label="Main navigation">
          {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <Link className="editorial-subscribe" href="/#newsletter">Subscribe</Link>
        <MobileNavigation links={links} />
      </div>
    </header>
    <BreakingBar />
  </>;
}
