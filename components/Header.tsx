import Link from "next/link";

const links = [
  ["/articles", "Latest"], ["/college-football", "College Football"],
  ["/college-football#live-boards", "Boards"], ["/schools", "Schools"],
  ["/recruiting", "Recruiting"], ["/writers", "Writers"],
] as const;

export function Header({ breaking = { href: "/college-football", text: "College football news and analysis" } }: {
  breaking?: { href: string; text: string };
}) {
  const navigation = links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>);
  return <>
    <header className="editorial-header">
      <div className="shell editorial-nav">
        <Link href="/" className="editorial-brand"><span aria-hidden="true">TT</span>Top Tier</Link>
        <nav className="editorial-desktop-nav" aria-label="Main navigation">{navigation}</nav>
        <Link className="editorial-subscribe" href="/#newsletter">Subscribe</Link>
        <details className="editorial-mobile-nav">
          <summary aria-label="Navigation menu"><span aria-hidden="true">☰</span></summary>
          <nav aria-label="Mobile navigation">{navigation}</nav>
        </details>
      </div>
    </header>
    <div className="editorial-breaking"><div className="shell"><strong>Breaking</strong><Link href={breaking.href}>{breaking.text}</Link></div></div>
  </>;
}
