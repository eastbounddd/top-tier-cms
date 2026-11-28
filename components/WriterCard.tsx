import { writerPath } from "@/lib/writerPaths";
import Link from "next/link";
import { XAccountLink } from "@/components/XAccountLink";
import { WriterAvatar } from "@/components/WriterAvatar";
import { writerSchool } from "@/lib/writerDirectory";
import { schoolTheme } from "@/lib/schoolColors";
import { publicWriterBio, writerXDisplayHandle, writerXHandle, type Writer } from "@/lib/writers";

export function WriterCard({ writer }: { writer: Writer }) {
  const handle = writerXHandle(writer);
  const school = writerSchool(writer);
  const bio = publicWriterBio(writer.bio);
  const profile = writerPath(writer.slug);
  return <aside className="compact-author-card" style={school ? schoolTheme(school.slug) : undefined}>
    <WriterAvatar name={writer.name} source={writer.profile_image} size={48} />
    <div className="compact-author-copy">
      <h2><Link href={profile}>{writer.name}</Link>{writer.coverage?.length > 0 && <span> · {writer.coverage.join(" · ")}</span>}</h2>
      {bio && <p>{bio}</p>}
    </div>
    <div className="compact-author-actions">
      {handle && <XAccountLink handle={handle} label={`@${writerXDisplayHandle(handle)}`} className="directory-follow" />}
      <Link href={profile}>More articles →</Link>
    </div>
  </aside>;
}
