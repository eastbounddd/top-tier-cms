import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { schools } from "@/lib/schools";
import { XAccountLink } from "@/components/XAccountLink";

export const metadata = {
  title: "Schools",
  description: "Find Top Tier reporting and articles for every school we cover.",
};

export default function SchoolsPage() {
  return <>
    <Header />
    <main className="schools-page shell">
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
                src={`/api/x-avatar?handle=${encodeURIComponent(school.xHandle)}`}
                alt={`${school.name} X account logo`}
              />
            </Link>
            <div className="school-card-meta">
              <span>School Coverage</span>
              <XAccountLink handle={school.xHandle} />
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
