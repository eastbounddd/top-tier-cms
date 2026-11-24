import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Top Tier, Top Tier Media's college sports site for college football news, analysis, graphics, and original reporting.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="shell policy-page">
        <h1>About Top Tier</h1>
        <p>Top Tier is the college sports site from Top Tier Media, built for fans who want clear news, sharp analysis, and original reporting. We are college football first. We also cover the wider college sports world, including basketball, recruiting, and the program stories that shape a season.</p>
        <p>We launched in August 2016 with a simple aim: tell the story before everyone else, and write it like people who actually watch the games. On toptierstate.net you will find news, analysis, original graphics, and weekly TV guides, plus coverage of schools across the country. Whether you follow a national title contender or a Group of Five program, we want this to be a place you can check and leave more informed.</p>
        <p>Our work is a team effort. Volunteer writers contribute articles through our writer dashboard, covering the programs they know best. That community is a big part of what makes Top Tier different. You can also find us on X at @TopTierStateX, on Instagram at @TopTierState, and on TikTok at @TopTierState, where we share news, highlights, and the graphics our audience comes back for.</p>
        <p>If you want the week&#39;s biggest stories in your inbox, sign up for our free newsletter, Top Tier Weekly, on the site. It is free, and you can unsubscribe anytime. We also welcome partnership and advertising inquiries, and we are always interested in hearing from writers who want to cover the teams they know best.</p>
        <p>For questions, story ideas, or partnership inquiries, email <a href="mailto:partners@ttmediaco.net">partners@ttmediaco.net</a>. We are glad you are here, and we are just getting started.</p>
      </main>
      <Footer />
    </>
  );
}
