import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export const metadata: Metadata = { title: "About", description: "Learn about Top Tier and its college sports coverage.", alternates: { canonical: "/about" } };
export default function AboutPage() { return <><Header/><main id="main-content" className="shell policy-page"><h1>About Top Tier</h1><p>Top Tier provides college football news, analysis and original reporting for fans.</p><h2>Our mission</h2><p>TODO: Add the official mission statement.</p><h2>Ownership and masthead</h2><p>TODO: Add verified ownership information and the names and roles of the editorial team.</p><h2>Contact</h2><p>Contact the team at <a href="mailto:partners@ttmediaco.net">partners@ttmediaco.net</a>.</p><p>TODO: Add any additional verified editorial and business contact information.</p></main><Footer/></>; }
