import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { createClient } from "@/lib/supabase/server";
import { getSchoolBySlug, schools } from "@/lib/schools";

export const generateStaticParams = () => schools.map(({ slug }) => ({ slug }));

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("id,title,slug,excerpt,cover_image_url,category,published_at,is_top_story,school")
    .eq("status", "published")
    .eq("school", school.name)
    .order("published_at", { ascending: false });

  return <>
    <Header />
    <main className="school-page shell">
      <div className="schools-heading">
        <small>TOP TIER SCHOOL COVERAGE</small>
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
    <Footer />
  </>;
}
