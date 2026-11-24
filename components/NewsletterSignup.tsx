"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { newsletterEndpoint, newsletterHoneypot, type NewsletterResult } from "@/lib/newsletter";
import styles from "./NewsletterSignup.module.css";

export function NewsletterSignup({ variant = "featured" }: {
  variant?: "featured" | "article" | "footer";
}) {
  const id = useId();
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<NewsletterResult | null>(null);
  const complete = result && result.status !== "error";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || complete) return;
    busy.current = true;
    setSubmitting(true);
    setResult(null);
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch(newsletterEndpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fields.get("email"), [newsletterHoneypot]: fields.get(newsletterHoneypot) }),
        signal: AbortSignal.timeout(15_000),
      });
      const data: NewsletterResult = await response.json();
      if (typeof data.message !== "string" || !["success", "subscribed", "error"].includes(data.status) ||
          (!response.ok && data.status !== "error")) throw new Error("Invalid response");
      setResult(data);
    } catch {
      setResult({ status: "error", message: "We couldn't confirm your signup. Please try again." });
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return <section className={`${styles.newsletter} ${styles[variant]}`} aria-labelledby={`${id}-title`}>
    <div className={styles.copy}>
      <small className={styles.eyebrow}>TOP TIER NEWSLETTER</small>
      <h2 id={`${id}-title`} className={styles.title}>Stay On Top of College Sports.</h2>
      {variant !== "footer" && <p className={styles.description}>Breaking news, recruiting updates, transfer portal news, scores and the biggest stories delivered directly to your inbox.</p>}
    </div>
    <form action={newsletterEndpoint} method="post" onSubmit={submit} className={styles.form} aria-busy={submitting}>
      <label htmlFor={`${id}-email`} className={styles.hidden}>Email address</label>
      <div className={styles.controls}>
        <input id={`${id}-email`} className={styles.email} name="email" type="email" autoComplete="email" placeholder="Enter your email address" required maxLength={254} readOnly={submitting || Boolean(complete)} aria-describedby={`${id}-note ${id}-status`} />
        <button className={`red-button ${styles.button}`} type="submit" disabled={submitting || Boolean(complete)}>{submitting ? "JOINING..." : complete ? "THANK YOU" : "JOIN FREE"}</button>
      </div>
      <div className={styles.hidden} aria-hidden="true">
        <input type="text" name={newsletterHoneypot} tabIndex={-1} defaultValue="" autoComplete="off" aria-label="Leave this field empty" />
      </div>
      <p id={`${id}-note`} className={styles.note}>Free. No spam. Unsubscribe anytime. By subscribing you agree to our <Link href="/privacy">Privacy Policy</Link>.</p>
      <div id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true" className={`${styles.status} ${result?.status === "error" ? styles.error : ""}`}>
        {submitting ? "Submitting your signup…" : result?.message}
      </div>
    </form>
  </section>;
}
