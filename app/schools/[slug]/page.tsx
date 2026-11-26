import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd, LiveBoards, Story, StoryGrid } from "@/components/Editorial";
import { XAccountLink } from "@/components/XAccountLink";
import { stories, storyList } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";
import { schoolTheme } from "@/lib/schoolColors";
import { getSchoolBySlug, schools } from "@/lib/schools";
import { breadcrumbSchema } from "@/lib/structuredData";

export const revalidate = 60;
export const dynamic = "force-static";
export const generateStaticParams = () => schools.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const school = getSchoolBySlug((await params).slug);
  if (!school) return {};
  return pageMetadata(`${school.name} Football News, Analysis & Reporting`, `Follow the latest ${school.name} football news, analysis and original reporting from Top Tier, with updates from across college sports.`, `/schools/${school.slug}`);
}

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const school = getSchoolBySlug((await params).slug);
  if (!school) notFound();
  const articles = await stories({ school: school.name, limit: 40 });
  const [lead, ...latest] = articles;
  const path = `/schools/${school.slug}`;
  return <>
    <Header />
    <main id="main-content" className="editorial shell" style={schoolTheme(school.slug)}>
      <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/schools">Schools</Link><span aria-hidden="true">/</span><span aria-current="page">{school.name}</span></nav>
      <div className="school-banner"><div><h1>{school.name}</h1><p>Football news, analysis, and original reporting</p></div><XAccountLink handle={school.xHandle} /></div>
      <div className="newsroom-grid">
        {lead ? <Story article={lead} lead /> : <p>No {school.name} articles have been published yet.</p>}
        <LiveBoards />
      </div>
      {latest.length > 0 && <section className="editorial-section">
        <div className="editorial-heading"><h2>Latest {school.name} Stories</h2><Link href="/schools">All schools →</Link></div>
        <StoryGrid articles={latest} />
      </section>}
    </main>
    <Footer />
    <JsonLd data={[breadcrumbSchema([{ name: "Schools", path: "/schools" }, { name: school.name, path }]), storyList(`${school.name} stories`, articles)]} />
  </>;
}
