"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
export function LogoutButton(){const router=useRouter();return <button className="outline-button" onClick={async()=>{await createClient().auth.signOut();router.push("/login");router.refresh();}}>Sign Out</button>}
