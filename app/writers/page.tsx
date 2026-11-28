import { writerPath } from "@/lib/writerPaths";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DirectoryExplorer } from "@/components/DirectoryExplorer";
import { WriterAvatar } from "@/components/WriterAvatar";
import { stories } from "@/lib/editorial";
import { listWriters, writerRole, writerSchool } from "@/lib/writerDirectory";
import { schoolTheme } from "@/lib/schoolColors";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata("Writers", "Meet the people behind Top Tier’s college sports reporting.", "/writers");
export const dynamic = "force-static";
export const revalidate = 60;

export default async function WritersIndex() {
  const [writers, archive] = await Promise.all([listWriters(), stories({ limit: null })]);
  const counts = new Map<string, number>();
  for (const article of archive) if (article.writer_profile_id) counts.set(article.writer_profile_id, (counts.get(article.writer_profile_id) ?? 0) + 1);
  const entries = writers.map(writer => {
    const school = writerSchool(writer), role = writerRole(writer), count = counts.get(writer.id) ?? 0;
    const beat = writer.coverage?.[0] || "College Sports";
    const path = writerPath(writer.slug);
    return { id: writer.id, searchable: [writer.name, writer.title, ...(writer.coverage || [])].filter(Boolean).join(" "), filters: [role],
      card: <article className="directory-card writer-directory-card" style={schoolTheme(school?.slug)}>
        <WriterAvatar source={writer.profile_image} name={writer.name} />
        <h2><Link href={path}>{writer.name}</Link></h2>
        <p>{writer.title || (role === "Beat Writers" ? "Beat Writer" : "Staff Writer")}</p>
        <span className="editorial-pill">{beat}</span>
        <div className="directory-card-actions"><span>{count} {count === 1 ? "article" : "articles"}</span><Link href={path}>View Articles →</Link></div>
      </article>,
    };
  });
  return <><Header /><main id="main-content" className="editorial shell newsroom-index">
    <section className="newsroom-heading"><small>Meet the Team · Top Tier Newsroom</small><h1>Writers</h1><p>Meet the writers and beat reporters behind Top Tier.</p><a href="mailto:partners@ttmediaco.net?subject=Write%20for%20Top%20Tier">Write for Top Tier →</a></section>
    <DirectoryExplorer entries={entries} filters={["All","Leadership","Beat Writers","Staff Writers"]} placeholder="Search writers or beats..." gridClass="directory-grid" />
  </main><Footer /></>;
}
