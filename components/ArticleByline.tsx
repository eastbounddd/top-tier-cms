import Link from "next/link";
import { ArticleShare } from "@/components/ArticleShare";
import { WriterAvatar } from "@/components/WriterAvatar";
import { editorialDate } from "@/lib/editorial";

type Props = {
  name: string; profile?: string; image?: string; brandLogo?: boolean;
  published?: string; modified?: string; title: string; url: string; xUrl: string;
};

export function ArticleByline({ name, profile, image, brandLogo, published, modified, title, url, xUrl }: Props) {
  const identity = <>
    <span aria-hidden="true" className={brandLogo ? "byline-avatar byline-avatar-brand" : "byline-avatar"}>
      <WriterAvatar key={image || name} name={name} source={image} size={80} allowBrandLogo={brandLogo} />
    </span>
    <span>
      By {profile ? <span className="byline-writer-name">{name}</span> : <strong>{name}</strong>}
      <span className="editorial-dates">
        {published && <span>Published <time dateTime={published}>{editorialDate(published, true)}</time></span>}
        {modified && modified !== published && <span>Updated <time dateTime={modified}>{editorialDate(modified, true)}</time></span>}
      </span>
    </span>
  </>;
  return <div className="editorial-byline">
    {profile
      ? <Link className="byline-identity" href={profile}>{identity}</Link>
      : <span className="byline-identity">{identity}</span>}
    <ArticleShare title={title} url={url} xUrl={xUrl} />
  </div>;
}
