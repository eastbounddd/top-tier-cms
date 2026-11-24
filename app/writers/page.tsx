import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { writerImage, type Writer } from "@/lib/writers";
export const metadata: Metadata = { title: "Writers", description: "Meet the writers covering college sports for Top Tier.", alternates: { canonical: "/writers" } };
export const dynamic = "force-dynamic";
export default async function WritersIndex() {
 const db = await createClient(); const { data } = await db.from("writer_profiles").select("*").order("name");
 return <><Header/><main className="shell writers-page"><div className="schools-heading"><small>MEET THE TEAM</small><h1>Writers</h1><p>Meet the people behind Top Tier&apos;s coverage.</p></div>
 <div className="writers-grid">{(data as Writer[] | null)?.map(writer => <Link className="writer-tile" href={`/author/${writer.slug}`} key={writer.id}><img src={writerImage(writer)} alt={writer.name}/><h2>{writer.name}</h2>{writer.title && <p>{writer.title}</p>}<p>{writer.coverage?.join(" · ")}</p></Link>)}</div></main><Footer/></>;
}
