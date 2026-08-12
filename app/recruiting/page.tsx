import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Recruiting",
  description: "The latest college football recruiting news, analysis, and original reporting from Top Tier.",
  alternates: { canonical: "/recruiting" },
};

export default async function RecruitingPage() {
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("id,title,slug,excerpt,cover_image_url,category,published_at,is_top_story,school")
    .eq("status", "published")
    .eq("school", "Recruiting")
    .order("published_at", { ascending: false });

  return <>
    <Header />
    <main className="school-page shell">
      <div className="schools-heading">
        <small>TOP TIER RECRUITING COVERAGE</small>
        <h1>Recruiting</h1>
        <p>The latest college football recruiting news, analysis, and original reporting.</p>
      </div>
      {articles?.length ? (
        <div className="news-grid">
          {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
        </div>
      ) : (
        <div className="school-empty">No Recruiting articles have been published yet.</div>
      )}
    </main>
    <Footer />
  </>;
}
