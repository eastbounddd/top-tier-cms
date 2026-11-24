import type { SupabaseClient } from "@supabase/supabase-js";

export type Writer = { id: string; slug: string; name: string; profile_image: string | null; coverage: string[]; x_handle: string | null; bio: string; title: string | null; joined_date: string | null };
export const writerImage = (writer: Writer) => writer.profile_image || "/top-tier-logo.png";
export function writerXHandle(writer: Writer) {
  const handle = writer.x_handle?.trim().replace(/^@/, "");
  return handle && /^[A-Za-z0-9_]{1,15}$/.test(handle) ? handle : null;
}
export async function attachWriters<T extends { writer_profile_id?: string | null }>(client: SupabaseClient, articles: T[]): Promise<(T & { writer?: Writer })[]> {
  const ids = [...new Set(articles.map(a => a.writer_profile_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return articles;
  const { data } = await client.from("writer_profiles").select("*").in("id", ids);
  const writers = new Map((data || []).map((writer: Writer) => [writer.id, writer]));
  return articles.map(article => ({ ...article, writer: article.writer_profile_id ? writers.get(article.writer_profile_id) : undefined }));
}
