import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { schools } from "@/lib/schools";

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
          <Link key={school.slug} href={`/schools/${school.slug}`} className="school-link-card">
            <img
              src={`/api/x-avatar?handle=${encodeURIComponent(school.xHandle)}`}
              alt={`${school.name} X account logo`}
            />
            <span>School Coverage</span>
            <h2>{school.name}</h2>
            <b>View Articles →</b>
          </Link>
        ))}
      </div>
    </main>
    <Footer />
  </>;
}
