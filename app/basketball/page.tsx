import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsFeed } from "@/components/NewsFeed";
import { basketballStories } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-static";
export const revalidate = 60;
const title = "College Basketball News, Recruiting & Scores | Top Tier State";
export const metadata = {
  ...pageMetadata("College Basketball News, Recruiting & Scores", "100% free college basketball news, recruiting, transfer portal, and game coverage.", "/basketball"),
  title: { absolute: title },
};

export default async function BasketballPage() {
  const articles = await basketballStories();
  return <><Header /><main id="main-content" className="editorial shell newsroom-index">
    <section className="newsroom-heading"><small>Top Tier Hoops</small><h1>College Basketball</h1>
      <p>100% free college basketball news, recruiting, transfer portal, and game coverage.</p>
    </section>
    <NewsFeed articles={articles} basketball />
  </main><Footer /></>;
}
