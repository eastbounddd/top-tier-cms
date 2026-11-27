"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canPublish, chicagoDate } from "@/lib/articleWorkflow";
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
  body: { html: string; author_name: string; [key: string]: unknown };
  schedule?: string;
};

export async function saveArticle(id: string | null, fields: ArticleFields, updatedAt: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your login session expired. Please sign in again." };

  const articles = supabase.from("articles");
  const [{ data: profile }, existing] = await Promise.all([
    supabase.from("profiles").select("role,display_name").eq("id", user.id).maybeSingle(),
    id ? articles.select("id,status,published_at,body,updated_at").eq("id", id).maybeSingle() : null,
  ]);
  if (existing?.error) return { error: existing.error.message };
  if (id && !existing?.data) return { error: "Article not found or you don't have permission to save it." };
  if (id && existing?.data?.updated_at !== updatedAt) return { error: "This article changed since you opened it. Copy any unsaved edits before reloading." };
  if (!["draft", "ready_for_review", "scheduled", "published"].includes(fields.status)) return { error: "Invalid article status." };
  if (!canPublish(profile?.role) && ([fields.status, existing?.data?.status].some(status => status === "published" || status === "scheduled"))) {
    return { error: "Only editors can change published or scheduled articles." };
  }
  const scheduledAt = fields.status === "scheduled" ? chicagoDate(fields.schedule || "") : null;
  if (fields.status === "scheduled" && (!scheduledAt || Date.parse(scheduledAt) <= Date.now())) {
    return { error: "Choose a future Central Time that exists on the calendar." };
  }
  if (typeof fields.title !== "string" || !fields.title.trim() || typeof fields.slug !== "string" || !fields.slug.trim() ||
      typeof fields.body?.html !== "string" || !fields.body.author_name?.trim()) return { error: "Add a headline, URL slug and byline." };
  const previous = existing?.data;
  if (["scheduled", "published"].includes(fields.status) && previous?.status !== "published" &&
      (fields.slug.length < 8 || !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(fields.slug))) {
    return { error: "Use a descriptive URL slug of at least 8 characters with hyphen-separated words." };
  }
  const publishedAt = scheduledAt || (fields.status === "published"
    ? previous?.status === "published" || (previous?.status === "scheduled" && Date.parse(previous.published_at) <= Date.now())
      ? previous.published_at || new Date().toISOString()
      : new Date().toISOString()
    : null);

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
    body: { ...(typeof previous?.body === "object" ? previous.body : {}), ...fields.body },
    ...(publishedAt ? { published_at: publishedAt } : {}),
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

  const { data, error } = id
    ? await (updatedAt ? articles.update(article).eq("id", id).eq("updated_at", updatedAt) : articles.update(article).eq("id", id).is("updated_at", null)).select("id,updated_at").maybeSingle()
    : await articles.insert({ ...article, author_id: user.id }).select("id,updated_at").single();
  if (error || !data) return { error: error?.message || "The article changed or you no longer have permission to save it." };
  if (previous?.status === "published" || previous?.status === "scheduled" || ["published", "scheduled"].includes(fields.status)) {
    revalidatePath("/", "layout");
  }
  if (fields.status !== "draft") redirect("/dashboard");
  return { error: null, id: data.id, updatedAt: data.updated_at };
}

export async function publishReviewedArticle(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to publish.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!canPublish(profile?.role)) throw new Error("Only editors can publish.");
  const reviewed = supabase.from("articles");
  const { data: story, error: readError } = await reviewed.select("slug,title,updated_at").eq("id", id).maybeSingle();
  if (readError || !story) throw new Error(readError?.message || "Article not found.");
  if (!story.title?.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(story.slug || "") || story.slug.length < 8) {
    throw new Error("Add a headline and a descriptive slug in the editor before publishing.");
  }
  const { data, error } = await reviewed
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id).eq("updated_at", story.updated_at).in("status", ["ready_for_review", "pending_review"]).select("id").maybeSingle();
  if (error || !data) throw new Error(error?.message || "This article is no longer ready for review.");
  revalidatePath("/", "layout");
}