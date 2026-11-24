import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export const metadata: Metadata = { title: "Terms of Use", description: "Terms of use for the Top Tier website.", alternates: { canonical: "/terms" }, robots: { index: false } };
export default function TermsPage() { return <><Header/><main className="shell policy-page"><h1>Terms of Use</h1><p><strong>TODO: The site owner must provide and review the terms of use.</strong></p><p>TODO: Add the actual terms governing site use, content rights, third-party links, disclaimers, contact details and effective date after legal review.</p></main><Footer/></>; }
