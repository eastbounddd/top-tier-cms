import { breadcrumbSchema, schemaJson } from "@/lib/structuredData";
import { pageMetadata } from "@/lib/pageMetadata";
import { attachWriters } from "@/lib/writers";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { createClient } from "@/lib/supabase/server";
import { getSchoolBySlug, schools } from "@/lib/schools";
import { XAccountLink } from "@/components/XAccountLink";

export async function generateMetadata({ params }: { params: Promise<{slug:string}> }) { const school = getSchoolBySlug((await params).slug); return school ? pageMetadata(`${school.name} Football News, Analysis & Reporting`, `Follow the latest ${school.name} football news, analysis and original reporting from Top Tier, with updates from across college sports.`, `/schools/${school.slug}`) : {}; }

export const generateStaticParams = () => schools.map(({ slug }) => ({ slug }));

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("school", school.name)
    .order("published_at", { ascending: false });

  const articles = await attachWriters(supabase, rows ?? []);
  return <>
    <Header />
    <main id="main-content" className="school-page shell">
      <div className="schools-heading">
        <img
          className="school-page-logo"
          src={`/api/x-avatar?handle=${encodeURIComponent(school.xHandle)}`}
          alt={`${school.name} X account logo`}
        />
        <div className="school-kicker-row">
          <small>TOP TIER SCHOOL COVERAGE</small>
          <XAccountLink handle={school.xHandle} />
        </div>
        <h1>{school.name}</h1>
        <p>The latest {school.name} news, analysis, and original reporting.</p>
      </div>
      {articles?.length ? (
        <div className="news-grid">
          {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
        </div>
      ) : (
        <div className="school-empty">No {school.name} articles have been published yet.</div>
      )}
    </main>
    <Footer /><script type="application/ld+json" dangerouslySetInnerHTML={{__html:schemaJson(breadcrumbSchema([{name:"Schools",path:"/schools"},{name:school.name,path:`/schools/${school.slug}`}]))}} />
  </>;
}
