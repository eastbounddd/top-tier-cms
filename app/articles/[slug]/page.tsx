import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const supabase = await createClient();
  const { data } = await supabase.from("articles").select("*,profiles(display_name,avatar_url)").eq("slug",slug).eq("status","published").single();
  if (!data) notFound();
  const body = typeof data.body === "object" && data.body?.html ? data.body.html : String(data.body ?? "");
  return <><Header/><main className="article-page shell"><small>{data.category}</small><h1>{data.title}</h1><p className="article-deck">{data.excerpt}</p><div className="byline">By {(data.profiles as any)?.display_name || "Top Tier"} · {data.published_at ? new Date(data.published_at).toLocaleDateString() : ""}</div>{data.cover_image_url && <Image className="cover" src={data.cover_image_url} alt="" width={1400} height={780}/>}<article className="prose" dangerouslySetInnerHTML={{__html:body}}/></main><Footer/></>;
}
