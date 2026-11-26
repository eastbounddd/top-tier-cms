import { Suspense } from "react";
import { ArticleEditor } from "@/components/ArticleEditor";
export const dynamic = "force-dynamic";
export default function NewArticlePage(){return <main id="main-content" className="editor-page"><Suspense fallback={<p>Loading editor…</p>}><ArticleEditor/></Suspense></main>}
