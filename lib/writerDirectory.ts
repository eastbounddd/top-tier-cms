import { cache } from "react";
import { editorialClient, schoolByName } from "@/lib/editorial";
import type { Writer } from "@/lib/writers";

export const writerSchool = (writer: Writer) => writer.coverage?.map(schoolByName).find(Boolean);
export function writerRole(writer: Writer) {
  if (/owner|founder|editor|director|leadership/i.test(writer.title ?? "")) return "Leadership";
  return /beat/i.test(writer.title ?? "") || writerSchool(writer) ? "Beat Writers" : "Staff Writers";
}

export const getWriter = cache(async (slug: string): Promise<Writer | null> => {
  const { data, error } = await editorialClient().from("writer_profiles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export async function listWriters(): Promise<Writer[]> {
  const { data, error } = await editorialClient().from("writer_profiles").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
