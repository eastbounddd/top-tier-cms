import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsFeed } from "@/components/NewsFeed";
import { schoolByName, stories } from "@/lib/editorial";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata("Recruiting", "Free college football recruiting intel, flip watch, and scoops from Top Tier.", "/recruiting");
export const dynamic = "force-static";
export const revalidate = 60;

export default async function RecruitingPage() {
  const archive = await stories({ limit: null });
  const articles = archive.filter(article => article.school === "Recruiting" || article.category === "Recruiting" ||
    /\b(?:recruiting|commit(?:ment|s|ted)?|flip(?:s|ped)?|prospect)\b/i.test(article.title));
  const hubs = new Map(["LSU", "Alabama", "Georgia", "Florida State", "Texas", "Oklahoma"].map(name => [name, schoolByName(name)!]));
  for (const article of articles) {
    const school = schoolByName(article.school);
    if (school) hubs.set(school.name, school);
  }
  const writers = [...new Map(articles.flatMap(article => article.writer ? [[article.writer.id, article.writer] as const] : [])).values()].slice(0, 5);
  const rail = <aside className="editorial-rail">
    <section className="rail-card"><h2>Recruiting School Hubs</h2><ul>{[...hubs.values()].slice(0, 7).map(school => <li key={school.slug}><Link href={`/schools/${school.slug}`}>{school.name}</Link></li>)}</ul></section>
    {writers.length > 0 && <section className="rail-card"><h2>Follow Recruiting Writers</h2><ul>{writers.map(writer => <li key={writer.id}><Link href={`/writers/${writer.slug}`}>{writer.name}</Link></li>)}</ul></section>}
  </aside>;
  return <><Header /><main id="main-content" className="editorial shell newsroom-index">
    <section className="newsroom-heading"><small>Top Tier Recruiting Coverage</small><span className="free-note">✓ 100% Free · No Paywalls</span><h1>Recruiting</h1><p>Free college football recruiting intel, flip watch, and scoops—never behind a paywall.</p></section>
    <NewsFeed articles={articles} recruiting rail={rail} />
  </main><Footer /></>;
}
