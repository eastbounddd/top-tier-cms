import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd, LiveBoards, SchoolBadge, SchoolBeatCard, SchoolStoryList, Story } from "@/components/Editorial";
import { XAccountLink } from "@/components/XAccountLink";
import { stories, storyList } from "@/lib/editorial";
import { canonicalSite, pageMetadata } from "@/lib/pageMetadata";
import { schoolColors, schoolTheme } from "@/lib/schoolColors";
import { getSchoolBySlug, schools } from "@/lib/schools";
import { breadcrumbSchema } from "@/lib/structuredData";

export const revalidate = 60;
export const dynamic = "force-static";
export const generateStaticParams = () => schools.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const school = getSchoolBySlug((await params).slug);
  if (!school) return {};
  if (school.slug === "lsu") return pageMetadata(
    "LSU Football & Sports News, Analysis, and Recruiting",
    "Follow the latest LSU Tigers football and sports news, recruiting updates, analysis, and original reporting from Top Tier.",
    "/schools/lsu",
  );
  return pageMetadata(`${school.name} Football News, Analysis & Reporting`, `Follow the latest ${school.name} football news, analysis and original reporting from Top Tier, with updates from across college sports.`, `/schools/${school.slug}`);
}

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const school = getSchoolBySlug((await params).slug);
  if (!school) notFound();
  const articles = await stories({ taggedSchools: [school.name], limit: 40 });
  const [lead, ...latest] = articles.length ? articles : await stories({ category: "College Football", limit: 6 });
  const displayHandle = school.xDisplayHandle || school.xHandle;
  const path = `/schools/${school.slug}`;
  return <>
    <Header />
    <main id="main-content" className="editorial school-hub shell" style={schoolTheme(school.slug)}>
      <div className="school-banner">
        <div className="school-banner-identity"><SchoolBadge school={school} size={44} banner /><div><h1>{school.name}</h1><p>School Hub · Football · Recruiting · Basketball</p><span className="free-note">✓ 100% Free · No Paywalls</span></div></div>
        {school.xHandle && <div className="school-banner-social">
          <XAccountLink handle={school.xHandle} className="school-follow-pill" label={`Follow @${displayHandle}`}
            compactLabel={(displayHandle?.length ?? 0) > 12 ? `@${displayHandle}` : undefined} />
          <span>{schoolColors(school.slug).abbr} beat</span>
        </div>}
      </div>
      <nav className="editorial-breadcrumb school-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">›</span><Link href="/schools">Schools</Link><span aria-hidden="true">›</span><span aria-current="page">{school.name}</span></nav>
      <div className="school-hub-grid">
        <div>{!articles.length && <h2 className="national-feed-label">More College Football</h2>}
          {lead ? <Story article={lead} lead schoolLead={Boolean(articles.length)} /> : <p>No articles have been published yet.</p>}
          {latest.length > 0 && <SchoolStoryList articles={latest} />}
        </div>
        <aside className="school-hub-rail"><SchoolBeatCard school={school} /><LiveBoards light /></aside>
      </div>
    </main>
    <Footer />
    <JsonLd data={[breadcrumbSchema([{ name: "Schools", path: "/schools" }, { name: school.name, path }]), storyList(`${school.name} stories`, articles),
      ...(school.xHandle ? [{ "@context": "https://schema.org", "@type": "WebPage", url: canonicalSite + path,
        about: { "@type": "SportsTeam", name: school.name }, sameAs: `https://x.com/${school.xHandle}` }] : []),
    ]} />
  </>;
}
