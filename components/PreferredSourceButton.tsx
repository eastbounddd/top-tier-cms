import type { School } from "@/lib/schools";
import { schoolPrimaryPill } from "@/lib/schoolColors";

import { GoogleMark, preferredSourceUrl } from "@/components/PreferredSource";

export function PreferredSourceButton({ school }: { school?: School }) {
  return (
    <a className="preferred-source-pill" href={preferredSourceUrl} target="_blank" rel="noopener noreferrer"
      style={schoolPrimaryPill(school?.slug)}>
      <span className="preferred-source-pill-icon"><GoogleMark /></span>
      Add us as a preferred source
    </a>
  );
}
