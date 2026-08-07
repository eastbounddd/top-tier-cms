import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WriterManager } from "@/components/WriterManager";
export default async function WritersPage(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const {data:me}=await supabase.from("profiles").select("role").eq("id",user.id).single();if(me?.role!=="owner")redirect("/dashboard");const {data:writers}=await supabase.from("profiles").select("id,display_name,role,is_active,created_at").order("created_at");return <main className="manager-page shell"><Link href="/dashboard">← Dashboard</Link><h1>Manage Writers</h1><WriterManager/><div className="panel"><h2>Current Team</h2>{writers?.map(w=><div className="writer-row" key={w.id}><div><b>{w.display_name}</b><span>{w.role}</span></div><em>{w.is_active?"Active":"Disabled"}</em></div>)}</div></main>}
