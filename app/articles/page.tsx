import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsFeed } from "@/components/NewsFeed";
import { stories } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata("All Articles", "Browse the latest college sports news, recruiting coverage, features and stories from Top Tier.", "/articles");
export const dynamic = "force-static";
export const revalidate = 60;

export default async function AllArticlesPage() {
  const articles = await stories({ limit: null });
  return <><Header /><main id="main-content" className="editorial shell newsroom-index">
    <section className="newsroom-heading"><small>Latest from Top Tier</small><h1>All Articles</h1><p>College sports news, analysis, recruiting and original reporting from the Top Tier newsroom.</p></section>
    <NewsFeed articles={articles} />
  </main><Footer /></>;
}
