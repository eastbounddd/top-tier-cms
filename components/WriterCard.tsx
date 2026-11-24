import Link from "next/link";
import { writerImage, writerX, type Writer } from "@/lib/writers";
export function WriterCard({ writer }: { writer: Writer }) {
  const x = writerX(writer);
  return <aside className="writer-card"><img src={writerImage(writer)} alt={writer.name} /><div>
    <h2><Link href={`/author/${writer.slug}`}>{writer.name}</Link></h2>
    {writer.coverage?.length > 0 && <p>{writer.coverage.join(" · ")}</p>}
    {writer.bio && <p>{writer.bio.split(/\n\s*\n/)[0].slice(0, 240)}</p>}
    <Link className="writer-link" href={`/author/${writer.slug}`}>More from {writer.name} →</Link>
    {x && <> · <a className="writer-link" href={x} target="_blank" rel="noopener noreferrer">X profile</a></>}
  </div></aside>;
}
