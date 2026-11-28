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
import { publicWriterBio, writerImage, writerXDisplayHandle, writerXHandle } from "@/lib/writers";
import { writerPath } from "@/lib/writerPaths";
import { canonicalSite, pageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-static";
export const revalidate = 60;
export const generateStaticParams = () => [];
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const writer = await getWriter((await params).slug);
  return writer ? pageMetadata(writer.name, `Read the latest reporting and analysis from ${writer.name} at Top Tier.`, writerPath(writer.slug)) : {};
}

export default async function WriterProfile({ params }: Props) {
  const writer = await getWriter((await params).slug);
  if (!writer) notFound();
  const articles = await stories({ writerId: writer.id, limit: null });
  const school = writerSchool(writer), xHandle = writerXHandle(writer);
  const bio = publicWriterBio(writer.bio);
  const schema = {
    "@context": "https://schema.org", "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person", name: writer.name, url: canonicalSite + writerPath(writer.slug),
      image: new URL(writerImage(writer), canonicalSite).toString(), jobTitle: writer.title || undefined,
      description: bio, sameAs: xHandle ? [`https://x.com/${xHandle}`] : undefined,
    },
  };
  return <><Header /><main id="main-content" className="editorial shell newsroom-index" style={schoolTheme(school?.slug)}>
    <nav className="editorial-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">›</span><Link href="/writers">Writers</Link><span aria-hidden="true">›</span><span aria-current="page">{writer.name}</span></nav>
    <section className="directory-card profile-card">
      <WriterAvatar name={writer.name} source={writer.profile_image} size={96} />
      <div><span className="editorial-pill">{writer.coverage?.join(" · ") || "College Sports"}</span><h1>{writer.name}</h1>
        {writer.title && <strong>{writer.title}</strong>}
        {bio && bio.split(/\n\s*\n/).filter(Boolean).map((paragraph,index) => <p key={index}>{paragraph}</p>)}
        <div className="profile-actions"><strong>{articles.length} {articles.length === 1 ? "story" : "stories"}</strong>
          {xHandle && <XAccountLink handle={xHandle} className="directory-follow" label={`Follow @${writerXDisplayHandle(xHandle)} on X`} />}
          {school && <Link className="profile-school-link" href={`/schools/${school.slug}`}>View {school.name} Hub →</Link>}
        </div>
      </div>
    </section>
    <section className="editorial-section">
      <div className="editorial-heading"><h2>Latest by {writer.name}</h2></div>
      {articles.length ? <div className="newsroom-feed">{articles.map(article => <NewsCard key={article.id} article={article} />)}</div> : <p>No articles have been published yet.</p>}
    </section>
  </main><Footer /><JsonLd data={[schema, breadcrumbSchema([{ name: "Writers", path: "/writers" }, { name: writer.name, path: writerPath(writer.slug) }])]} /></>;
}
