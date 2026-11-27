"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishReviewedArticle } from "@/app/dashboard/new/actions";

export function PublishButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div><button className="red-button" disabled={busy} onClick={async () => {
    setBusy(true);
    setError("");
    try { await publishReviewedArticle(id); router.refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Publication failed."); }
    finally { setBusy(false); }
  }}>{busy ? "Publishing…" : "Publish"}</button>{error && <p role="alert">{error}</p>}</div>;
}
