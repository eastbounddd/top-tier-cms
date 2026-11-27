import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CopyEmailButton } from "@/components/CopyEmailButton";
import { pageMetadata } from "@/lib/pageMetadata";
import { schools } from "@/lib/schools";

export const dynamic = "force-static";
export const revalidate = 60;
export const metadata = pageMetadata("Advertise with Top Tier", "Reach college sports fans through Top Tier social, site, school hub, and editorial sponsorships.", "/advertise");

const email = "partners@ttmediaco.net";

const audience = [
  { metric: "509K+", label: "Instagram Followers", account: "@TopTierState" },
  { metric: "117K+", label: "X Followers", account: "@TopTierStateX" },
  { metric: "24K+", label: "TikTok Followers", account: "@TopTierState" },
  { metric: String(schools.length), label: "Dedicated School Hubs", account: "toptierstate.net" },
];
const placements = [
  ["01 · Social & TV Guides", "Sponsored Social & TV Guides", "Branded integrations on high-reach X, Instagram, and TikTok graphics, including our weekly college TV guides (100K–200K avg impressions)."],
  ["02 · Site & Hubs", "Site & School Hub Takeovers", `High-visibility homepage, article, and conference or school hub sponsorships across ${schools.length} dedicated team hubs with zero paywalls.`],
  ["03 · Editorial & Recruiting", "Editorial & Newsletter Sponsorships", 'Native "Presented By" placements across daily college football dispatches, recruiting boards, and game-week coverage.'],
];
const benefits = [
  ["100% Free Access", "No paywalls mean every click from X, Instagram, and Google Discover reads the full story."],
  ["Year-Round College Sports Audience", "Football, basketball, transfer portal, and recruiting keep fans active 12 months a year."],
  ["Direct Owner-Run Execution", "Work directly with Top Tier Media leadership for fast turnaround and custom creative."],
];
export default function AdvertisePage() {
  return <><Header /><main id="main-content" className="editorial shell advertise">
    <section className="advertise-hero">
      <div className="newsroom-heading"><small>Partner with Top Tier</small><h1>Reach Diehard College Sports Fans</h1>
        <p>100% free editorial coverage, breaking news, and high-engagement social across college football and basketball.</p>
      </div>
      <div className="advertise-actions"><a className="advertise-primary" href={`mailto:${email}`}>Email {email}</a><CopyEmailButton email={email} /></div>
    </section>
    <dl className="advertise-stats" aria-label="Top Tier audience">
      {audience.map(({ metric, label, account }) => <div key={label}><dt>{label}</dt><dd><strong>{metric}</strong><span>{account}</span></dd></div>)}
    </dl>
    <div className="advertise-placements">
      {placements.map(([eyebrow, title, description]) => <article key={title}><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></article>)}
    </div>
    <section className="editorial-section advertise-benefits">
      <div className="editorial-heading"><h2>Why Brands Partner With Top Tier</h2></div>
      <div>{benefits.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>
    <section className="advertise-contact">
      <small>Advertising Inquiries</small><h2>Ready to Reach College Sports Fans?</h2>
      <p>Send your campaign goals, timeline, and target audience—our team replies directly.</p>
      <div className="advertise-actions"><a className="advertise-email" href={`mailto:${email}`}>{email}</a><CopyEmailButton email={email} />
        <a className="advertise-primary" href={`mailto:${email}`}>Email Our Team →</a>
      </div>
    </section>
  </main><Footer /></>;
}
