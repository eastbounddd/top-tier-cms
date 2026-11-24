import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { createClient } from "@/lib/supabase/server";
import { attachWriters } from "@/lib/writers";
export default async function NotFound() {
 let articles: any[] = [];
 try { const db = await createClient(); const {data} = await db.from("articles").select("*").eq("status","published").order("published_at",{ascending:false}).limit(3); articles = await attachWriters(db,data || []); } catch {}
 return <><Header/><main id="main-content" className="shell policy-page"><h1>Page not found</h1><p>We couldn’t find that page.</p><Link href="/" className="red-button">Back to home</Link>{articles.length > 0 && <section><h2>Recent stories</h2><div className="news-grid">{articles.map(article=><ArticleCard key={article.id} article={article}/>)}</div></section>}</main><Footer/></>;
}
