import Link from "next/link";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { SchoolBadge } from "@/components/Editorial";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { XAccountLink } from "@/components/XAccountLink";
import { pageMetadata } from "@/lib/pageMetadata";
import { schoolTheme } from "@/lib/schoolColors";
import { schools } from "@/lib/schools";

export const dynamic = "force-static";
export const revalidate = 60;
export const metadata = pageMetadata("College Football Schools", `${schools.length} Top Tier school hubs for team news, recruiting and original reporting.`, "/schools");

export default function SchoolsPage() {
  const entries = [...schools].sort((a,b) => a.name.localeCompare(b.name)).map(school => {
    const handle = school.xHandle;
    return { id: school.slug, searchable: `${school.name} ${school.slug} ${school.brand?.shortName ?? ""} ${school.brand?.mascot ?? ""} ${handle ? "@" + handle : ""}`, filters: [school.conference, ...(["AAC", "Mountain West", "Sun Belt"].includes(school.conference) ? ["Group of 5"] : [])],
      card: <article className="directory-card school-directory-card" style={schoolTheme(school.slug)}>
        <div className="directory-card-top"><div className="directory-school-logo"><SchoolBadge school={school} size={44} alt={`${school.name} logo`} /></div><span>{school.conference}</span></div>
        <h2><Link href={`/schools/${school.slug}`}>{school.name}</Link></h2>
        {handle && <p>@{handle}</p>}
        <div className="directory-card-actions"><Link href={`/schools/${school.slug}`}>View Hub →</Link>{handle && <XAccountLink handle={handle} className="directory-follow" label="Follow" />}</div>
      </article>,
    };
  });
  return <><Header /><main id="main-content" className="editorial shell newsroom-index">
    <section className="newsroom-heading"><small>Top Tier Team Coverage · {schools.length} School Hubs</small><h1>Schools</h1><p>Find your team for the latest college sports news, recruiting and analysis.</p></section>
    <DirectoryExplorer entries={entries} filters={[`All (${schools.length})`, "SEC", "Big 12", "Big Ten", "ACC", "Pac-12", "Group of 5"]} placeholder="Search schools or @handles..." gridClass="directory-grid" />
  </main><Footer /></>;
}
