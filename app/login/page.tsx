"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError("");const supabase=createClient();const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setError(error.message);setBusy(false);return;}router.push("/dashboard");router.refresh();};
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><Image src="/top-tier-logo.png" alt="Top Tier" width={190} height={190}/><small>WRITER PORTAL</small><h1>Welcome Back</h1><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="error">{error}</p>}<button className="red-button" disabled={busy}>{busy?"Signing in…":"Sign In"}</button><a href="/">← Back to site</a></form></main>;
}
