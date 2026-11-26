import Link from "next/link";
import { articlePath, breakingStories } from "@/lib/editorial";
import { BreakingViewport } from "@/components/BreakingViewport";

export async function BreakingBar() {
  const stories = await breakingStories();
  const headlines = stories.length
    ? stories.map(story => ({ href: articlePath(story.slug), title: story.title }))
    : [{ href: "/college-football", title: "College football news and analysis" }];
  const loop = headlines.length >= 5;

  const track = (clone = false) => <ul className={clone ? "breaking-headlines breaking-clone" : "breaking-headlines"} aria-hidden={clone || undefined}>
    {headlines.map(({ href, title }) => <li key={href}>
      <Link href={href} prefetch={false} tabIndex={clone ? -1 : undefined}>{title}</Link>
      <span aria-hidden="true">·</span>
    </li>)}
  </ul>;

  return <div className="editorial-breaking">
    <div className="shell">
      <div className="breaking-label"><strong>Breaking</strong></div>
      <BreakingViewport>
        <div className={loop ? "breaking-track breaking-loop" : "breaking-track"}>
          {track()}
          {loop && track(true)}
        </div>
      </BreakingViewport>
    </div>
  </div>;
}
