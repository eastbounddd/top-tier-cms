"use server";

import { createClient } from "@/lib/supabase/server";

type ArticleFields = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  school: string;
  cover_image_url: string;
  is_top_story: boolean;
  is_sponsored: boolean;
  status: string;
  writer_profile_id: string | null;
  body: { html: string; author_name: string };
  published_at?: string;
};

export async function saveArticle(id: string | null, fields: ArticleFields) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your login session expired. Please sign in again." };

  const table = "articles";
  const articles = supabase.from(table);
  if (id) {
    const [profile, existing] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      articles.select("id,author_id").eq("id", id).maybeSingle(),
    ]);
    console.info("Article update", {
      table, filter: { column: "id", operator: "eq", value: id },
      userId: user.id, role: profile.data?.role ?? null,
      rowId: existing.data?.id ?? null, authorId: existing.data?.author_id ?? null,
      profileError: profile.error?.code, lookupError: existing.error?.code,
    });
    if (existing.error) return { error: existing.error.message };
  }

  const payload = {
    title: fields.title,
    slug: fields.slug,
    excerpt: fields.excerpt,
    category: fields.category,
    school: fields.school,
    cover_image_url: fields.cover_image_url,
    is_top_story: fields.is_top_story,
    status: fields.status,
    writer_profile_id: fields.writer_profile_id,
    body: fields.body,
    ...(fields.published_at ? { published_at: fields.published_at } : {}),
  };

  const columns = [...Object.keys(payload), ...(!id ? ["author_id"] : [])].join(",");
  const { error: schemaError } = await articles.select(`${columns},is_sponsored`).limit(0);
  if (schemaError) {
    const missingSponsorship = schemaError.code === "42703" && schemaError.message.includes("is_sponsored");
    if (!missingSponsorship || fields.is_sponsored) return { error: schemaError.message };
    const { error: legacyError } = await articles.select(columns).limit(0);
    if (legacyError) return { error: legacyError.message };
  }
  const article = schemaError ? payload : { ...payload, is_sponsored: fields.is_sponsored ?? false };

  if (!id) {
    const { error } = await articles.insert({ ...article, author_id: user.id });
    return { error: error?.message ?? null };
  }

  const { data, error } = await articles.update(article).eq("id", id).select("id").maybeSingle();
  if (!data) console.warn("Article update returned no row", { id, userId: user.id, code: error?.code });
  return { error: error?.message ?? (data ? null : "Article not found or you don't have permission to save it.") };
}
