import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { articlePath } from "@/lib/articlePaths";
import { publicArticles } from "@/lib/articleWorkflow";

export async function GET(request: NextRequest) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to search." }, { status: 401 });
  const term = (request.nextUrl.searchParams.get("q") || "").replace(/[^\p{L}\p{N} -]/gu, "").trim().slice(0, 80);
  if (term.length < 2) return NextResponse.json([]);
  const { data, error } = await db.from("articles").select("title,slug,cover_image_url")
    .or(publicArticles()).ilike("title", `%${term}%`).order("published_at", { ascending: false }).limit(10);
  if (error) return NextResponse.json({ error: "Search could not load." }, { status: 502 });
  return NextResponse.json((data || []).map(row => ({ title: row.title, url: articlePath(row.slug), image: row.cover_image_url })));
}
