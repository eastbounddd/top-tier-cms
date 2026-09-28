"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { MAILCHIMP_ACTION, MAILCHIMP_HONEYPOT, type NewsletterResult } from "@/lib/newsletter";
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
    if ((event.nativeEvent as SubmitEvent).submitter?.getAttribute("name") === "hosted") return;
    event.preventDefault();
    if (busy.current || complete) return;
    busy.current = true;
    setSubmitting(true);
    setResult(null);
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ EMAIL: fields.get("EMAIL"), [MAILCHIMP_HONEYPOT]: fields.get(MAILCHIMP_HONEYPOT) }),
        signal: AbortSignal.timeout(15_000),
      });
      const data: NewsletterResult = await response.json();
      if (!data.message || !["success", "pending", "subscribed", "error"].includes(data.status)) throw new Error("Invalid response");
      setResult(data);
    } catch {
      setResult({ status: "error", message: "We couldn't confirm your signup. Please try again or continue securely with Mailchimp.", fallback: true });
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return <section className={`${styles.newsletter} ${styles[variant]}`} aria-labelledby={`${id}-title`}>
    <div className={styles.copy}>
      <small className={styles.eyebrow}>TOP TIER NEWSLETTER</small>
      <h2 id={`${id}-title`} className={styles.title}>Stay On Top of College Football.</h2>
      {variant !== "footer" && <p className={styles.description}>Breaking news, recruiting updates, transfer portal news, scores and the biggest stories delivered directly to your inbox.</p>}
    </div>
    <form action={MAILCHIMP_ACTION} method="post" target="_blank" rel="noopener noreferrer" onSubmit={submit} className={styles.form} aria-busy={submitting}>
      <label htmlFor={`${id}-email`} className={styles.hidden}>Email address</label>
      <div className={styles.controls}>
        <input id={`${id}-email`} className={styles.email} name="EMAIL" type="email" autoComplete="email" placeholder="Enter your email address" required maxLength={254} readOnly={submitting || Boolean(complete)} aria-describedby={`${id}-note ${id}-status`} />
        <button className={`red-button ${styles.button}`} type="submit" disabled={submitting || Boolean(complete)}>{submitting ? "JOINING..." : complete ? "THANK YOU" : "JOIN FREE"}</button>
      </div>
      <div className={styles.hidden} aria-hidden="true">
        <input type="text" name={MAILCHIMP_HONEYPOT} tabIndex={-1} defaultValue="" autoComplete="off" aria-label="Leave this field empty" />
      </div>
      <p id={`${id}-note`} className={styles.note}>Free. No spam. Unsubscribe anytime.</p>
      <div id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true" className={`${styles.status} ${result?.status === "error" ? styles.error : ""}`}>
        {submitting ? "Submitting your signup…" : result?.message}
      </div>
      {result?.fallback && <button type="submit" name="hosted" className={styles.fallback}>Continue with Mailchimp (opens a new tab)</button>}
      <noscript><p className={styles.note}>Signup opens securely in a new Mailchimp tab.</p></noscript>
    </form>
  </section>;
}
