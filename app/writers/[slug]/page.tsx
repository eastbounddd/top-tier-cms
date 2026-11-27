import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/Editorial";
import { NewsCard } from "@/components/NewsFeed";
import { WriterAvatar } from "@/components/WriterAvatar";
import { XAccountLink } from "@/components/XAccountLink";
import { stories } from "@/lib/editorial";
import { schoolTheme } from "@/lib/schoolColors";
import { breadcrumbSchema } from "@/lib/structuredData";
import { getWriter, writerSchool } from "@/lib/writerDirectory";
import { writerXHandle } from "@/lib/writers";
import { pageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-static";
export const revalidate = 60;
export const generateStaticParams = () => [];
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const writer = await getWriter((await params).slug);
  return writer ? pageMetadata(writer.name, `Read the latest reporting and analysis from ${writer.name} at Top Tier.`, `/writers/${writer.slug}`) : {};
}

export default async function WriterProfile({ params }: Props) {
  const writer = await getWriter((await params).slug);
  if (!writer) notFound();
  const articles = await stories({ writerId: writer.id, limit: null });
  const school = writerSchool(writer), xHandle = writerXHandle(writer);
  return <><Header /><main id="main-content" className="editorial shell newsroom-index" style={schoolTheme(school?.slug)}>
    <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">›</span><Link href="/writers">Writers</Link><span aria-hidden="true">›</span><span aria-current="page">{writer.name}</span></nav>
    <section className="directory-card profile-card">
      <WriterAvatar name={writer.name} source={writer.profile_image} size={96} />
      <div><span className="editorial-pill">{writer.coverage?.join(" · ") || "College Sports"}</span><h1>{writer.name}</h1>
        {writer.title && <strong>{writer.title}</strong>}
        {writer.bio && !/^TODO|profile details are awaiting editorial review/i.test(writer.bio) && writer.bio.split(/\n\s*\n/).filter(Boolean).map((paragraph,index) => <p key={index}>{paragraph}</p>)}
        <div className="profile-actions"><strong>{articles.length} {articles.length === 1 ? "story" : "stories"}</strong>
          {xHandle && <XAccountLink handle={xHandle} className="directory-follow" label={`Follow @${xHandle} on X`} />}
          {school && <Link className="profile-school-link" href={`/schools/${school.slug}`}>View {school.name} Hub →</Link>}
        </div>
      </div>
    </section>
    <section className="editorial-section">
      <div className="editorial-heading"><h2>Latest by {writer.name}</h2></div>
      {articles.length ? <div className="newsroom-feed">{articles.map(article => <NewsCard key={article.id} article={article} />)}</div> : <p>No articles have been published yet.</p>}
    </section>
  </main><Footer /><JsonLd data={breadcrumbSchema([{ name: "Writers", path: "/writers" }, { name: writer.name, path: `/writers/${writer.slug}` }])} /></>;
}
