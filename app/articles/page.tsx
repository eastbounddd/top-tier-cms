import { pageMetadata } from "@/lib/pageMetadata";
import { attachWriters } from "@/lib/writers";
import type { Metadata } from "next";
import { AllArticlesGrid } from "@/components/AllArticlesGrid";
import type { Article } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 12;

export const metadata: Metadata = pageMetadata("All Articles", "Browse the latest college sports news, recruiting coverage, features and stories from Top Tier.", "/articles");

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AllArticlesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(0, PAGE_SIZE);

  const page = await attachWriters(supabase, (data ?? []) as Article[]);

  return <>
    <Header />
    <main id="main-content" className="schools-page shell articles-index">
      <div className="schools-heading">
        <small>LATEST FROM TOP TIER</small>
        <h1>All Articles</h1>
      </div>
      <AllArticlesGrid
        initialArticles={page.slice(0, PAGE_SIZE)}
        initialHasMore={page.length > PAGE_SIZE}
      />
    </main>
    <Footer />
  </>;
}
