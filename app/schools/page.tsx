import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { schools } from "@/lib/schools";
import { XAccountLink } from "@/components/XAccountLink";

export const metadata = pageMetadata("College Football Schools", "Explore college football news, analysis and original reporting from the schools covered by Top Tier.", "/schools");

export default function SchoolsPage() {
  return <>
    <Header />
    <main id="main-content" className="schools-page shell">
      <div className="schools-heading">
        <small>TOP TIER TEAM COVERAGE</small>
        <h1>Schools</h1>
        <p>Choose a school to read its latest news, analysis, and original reporting.</p>
      </div>
      <div className="schools-grid">
        {schools.map((school) => (
          <article key={school.slug} className="school-link-card">
            <Link href={`/schools/${school.slug}`} className="school-card-logo">
              <img
                src={school.xHandle ? `/api/x-avatar?handle=${encodeURIComponent(school.xHandle)}` : "/top-tier-logo-optimized.webp"}
                alt={school.xHandle ? `${school.name} X account logo` : "Top Tier"}
              />
            </Link>
            <div className="school-card-meta">
              <span>School Coverage</span>
              {school.xHandle && <XAccountLink handle={school.xHandle} />}
            </div>
            <Link href={`/schools/${school.slug}`} className="school-card-copy">
              <h2>{school.name}</h2>
              <b>View Articles →</b>
            </Link>
          </article>
        ))}
      </div>
    </main>
    <Footer />
  </>;
}
