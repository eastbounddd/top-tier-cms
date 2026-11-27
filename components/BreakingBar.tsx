import Link from "next/link";
import { Fragment } from "react";
import { articlePath, breakingStories } from "@/lib/editorial";
import { BreakingViewport } from "@/components/BreakingViewport";

const tickerSizing = { WebkitTextSizeAdjust: "none", textSizeAdjust: "none" } as const;
export async function BreakingBar() {
  const stories = await breakingStories();
  const headlines = stories.length
    ? stories.map(story => ({ href: articlePath(story.slug), title: story.title }))
    : [{ href: "/college-football", title: "College football news and analysis" }];
  const loop = headlines.length >= 5;

  const track = (clone = false) => <div className={clone ? "breaking-headlines breaking-clone" : "breaking-headlines"} aria-hidden={clone || undefined} style={tickerSizing}>
    {headlines.map(({ href, title }) => <Fragment key={href}>
      <Link href={href} prefetch={false} tabIndex={clone ? -1 : undefined} style={tickerSizing}>{title}</Link>
      <span aria-hidden="true">·</span>
    </Fragment>)}
  </div>;

  return <div className="editorial-breaking" style={tickerSizing}>
    <div className="shell">
      <div className="breaking-label"><strong>Breaking</strong></div>
      <BreakingViewport>
        <div className={loop ? "breaking-track breaking-loop" : "breaking-track"} style={tickerSizing}>
          {track()}
          {loop && track(true)}
        </div>
      </BreakingViewport>
    </div>
  </div>;
}
