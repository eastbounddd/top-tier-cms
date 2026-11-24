import { Suspense } from "react";
import { ArticleEditor } from "@/components/ArticleEditor";
export default function NewArticlePage(){return <main id="main-content" className="editor-page"><Suspense fallback={<p>Loading editor…</p>}><ArticleEditor/></Suspense></main>}
