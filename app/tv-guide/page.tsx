import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { UpcomingGames } from "@/components/UpcomingGames";
import { pageMetadata } from "@/lib/pageMetadata";

export const revalidate = 60;
export const dynamic = "force-static";
export const metadata = pageMetadata("College Football TV Guide", "College football kickoff times in Central Time, TV networks, and live scores.", "/tv-guide");

export default function TvGuidePage() {
  return <>
    <Header />
    <main id="main-content" className="editorial shell">
      <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/college-football">College Football</Link></nav>
      <h1 className="editorial-title">College Football TV Guide</h1>
      <UpcomingGames full />
    </main>
    <Footer />
  </>;
}
