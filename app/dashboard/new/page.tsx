import { Suspense } from "react";
import { ArticleEditor } from "@/components/ArticleEditor";
export default function NewArticlePage(){return <main className="editor-page"><Suspense fallback={<p>Loading editor…</p>}><ArticleEditor/></Suspense></main>}
