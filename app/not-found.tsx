import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { stories } from "@/lib/editorial";
export default async function NotFound() {
 const articles = await stories({ limit: 3 }).catch(() => []);
 return <><Header/><main id="main-content" className="shell policy-page"><h1>Page not found</h1><p>We couldn’t find that page.</p><Link href="/" className="red-button">Back to home</Link>{articles.length > 0 && <section><h2>Recent stories</h2><div className="news-grid">{articles.map(article=><ArticleCard key={article.id} article={article}/>)}</div></section>}</main><Footer/></>;
}
