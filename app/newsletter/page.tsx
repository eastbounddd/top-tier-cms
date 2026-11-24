import { pageMetadata } from "@/lib/pageMetadata";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export const metadata: Metadata = pageMetadata("Newsletter", "Join the free Top Tier newsletter for college football news, recruiting updates, transfer portal news, scores and the biggest stories.", "/newsletter");

export default function NewsletterPage() {
  return <>
    <Header />
    <main id="main-content" className="schools-page shell">
      <div className="schools-heading">
        <small>COLLEGE FOOTBALL, IN YOUR INBOX</small>
        <h1>Newsletter</h1>
      </div>
      <NewsletterSignup variant="featured" />
    </main>
    <Footer />
  </>;
}
