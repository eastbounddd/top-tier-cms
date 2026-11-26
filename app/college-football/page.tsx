import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditorialNewsletter, JsonLd, LiveBoards, MoreStories, Story, StoryGrid, TeamGrid } from "@/components/Editorial";
import { stories, storyList } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";
import { breadcrumbSchema } from "@/lib/structuredData";

export const revalidate = 60;
export const dynamic = "force-static";
export const metadata = pageMetadata("College Football News & Analysis", "Follow the latest college football news, original analysis, playoff projections, coaching changes and reporting from Top Tier.", "/college-football");

export default async function CollegeFootballPage() {
  const articles = await stories({ football: true, limit: 13 });
  const [lead, ...rest] = articles;
  const moreFootball = rest.slice(0, 4);
  const latest = rest.slice(4);
  return <>
    <Header />
    <main id="main-content" className="editorial shell">
      <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">College Football</span></nav>
      <h1 className="editorial-title">College Football News &amp; Analysis</h1>
      <div className="newsroom-grid">
        {lead ? <Story article={lead} lead /> : <p>No college football stories have been published yet.</p>}
        <aside className="newsroom-rail"><LiveBoards id="live-boards" /><MoreStories title="More College Football" articles={moreFootball} /></aside>
      </div>
      <section className="editorial-section">
        <div className="editorial-heading"><h2>Latest College Football</h2><Link href="/articles">All articles →</Link></div>
        <StoryGrid articles={latest} />
      </section>
      <TeamGrid />
      <EditorialNewsletter />
    </main>
    <Footer newsletter={false} />
    <JsonLd data={[breadcrumbSchema([{ name: "College Football", path: "/college-football" }]), storyList("College football stories", articles)]} />
  </>;
}
