import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard, type Article } from "@/components/ArticleCard";
import { createClient } from "@/lib/supabase/server";
import { writerImage, writerX, type Writer } from "@/lib/writers";
import { siteUrl } from "@/lib/articleSocialImage";
export const dynamic = "force-dynamic";
const getWriter = cache(async (slug: string): Promise<Writer | null> => { const db = await createClient(); const {data} = await db.from("writer_profiles").select("*").eq("slug",slug).maybeSingle(); return data; });
export async function generateMetadata({params}: {params: Promise<{slug:string}>}): Promise<Metadata> {
 const writer = await getWriter((await params).slug); if (!writer) return {title:"Writer Not Found",robots:{index:false}};
 const title = `${writer.name} | Top Tier College Football Writer`; const description = writer.bio.replace(/\s+/g," ").slice(0,160) || `Read the latest articles by ${writer.name} at Top Tier.`; const url = `${siteUrl}/author/${writer.slug}`; const image = new URL(writerImage(writer),siteUrl).toString();
 return {title:{absolute:title},description,alternates:{canonical:url},openGraph:{type:"profile",title,description,url,images:[{url:image,alt:writer.name}]},twitter:{card:"summary",title,description,images:[{url:image,alt:writer.name}]}};
}
export default async function AuthorPage({params,searchParams}: {params:Promise<{slug:string}>;searchParams:Promise<{page?:string}>}) {
 const writer = await getWriter((await params).slug); if (!writer) notFound();
 const rawPage = Number((await searchParams).page); const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage,100000) : 1; const size=20;
 const db = await createClient(); const {data,error} = await db.from("articles").select("*").eq("status","published").eq("writer_profile_id",writer.id).order("published_at",{ascending:false}).order("id",{ascending:false}).range((page-1)*size,page*size);
 const articles = (data || []) as Article[]; const x=writerX(writer); const url=`${siteUrl}/author/${writer.slug}`;
 const schema={"@context":"https://schema.org","@type":"ProfilePage",mainEntity:{"@type":"Person",name:writer.name,image:new URL(writerImage(writer),siteUrl).toString(),jobTitle:writer.title || undefined,description:writer.bio || undefined,sameAs:x?[x]:[],url}};
 return <><Header/><main className="shell writers-page"><div className="writer-header"><img src={writerImage(writer)} alt={writer.name}/><div><small>TOP TIER WRITER</small><h1>{writer.name}</h1>{writer.title && <p>{writer.title}</p>}<div className="writer-tags">{writer.coverage?.map(tag=><span key={tag}>{tag}</span>)}</div>{x && <a className="outline-button" href={x} target="_blank" rel="noopener noreferrer">Follow on X ↗</a>}</div></div>
 {writer.bio && <section className="writer-about"><h2>About {writer.name}</h2>{writer.bio.split(/\n\s*\n/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</section>}
 <section className="writer-articles"><div className="section-row"><h2>Articles by {writer.name}</h2></div>{error ? <p>Articles could not be loaded. Please try again later.</p> : articles.length ? <div className="news-grid">{articles.slice(0,size).map(article=><ArticleCard key={article.id} article={{...article,writer}} metaLabel={article.school || article.category}/>)}</div> : <div className="school-empty">No articles have been published yet.</div>}
 <nav className="writer-pagination" aria-label="Article pages">{page>1 && <Link className="outline-button" href={page===2?url:`?page=${page-1}`}>Previous</Link>}{articles.length>size && <Link className="outline-button" href={`?page=${page+1}`}>Next</Link>}</nav></section></main><Footer/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/></>;
}
