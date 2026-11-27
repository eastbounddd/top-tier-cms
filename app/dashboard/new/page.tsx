import { redirect } from "next/navigation";
import { ArticleEditor } from "@/components/ArticleEditor";
import { canPublish } from "@/lib/articleWorkflow";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await db.from("profiles").select("role,display_name").eq("id", user.id).maybeSingle();
  const { id } = await searchParams;
  return <main id="main-content" className="editor-page"><ArticleEditor initialId={id || null}
    editorRole={canPublish(profile?.role)} displayName={profile?.display_name || ""} /></main>;
}
