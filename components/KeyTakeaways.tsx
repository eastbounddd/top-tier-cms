import { takeawayLead } from "@/lib/articlePresentation";

export function KeyTakeaways({ bullets, schoolAccent = false }: { bullets: string[]; schoolAccent?: boolean }) {
  if (!bullets.length) return null;
  return <section className={schoolAccent ? "takeaways key-takeaways key-takeaways-school" : "takeaways key-takeaways"}>
    <h2>Key Takeaways</h2>
    <ul aria-label="Key takeaways">{bullets.map((bullet, index) => {
      const { lead, rest } = takeawayLead(bullet);
      return <li key={index}>{lead && <strong>{lead}</strong>}{rest}</li>;
    })}</ul>
  </section>;
}
