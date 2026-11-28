"use client";

import { useEffect, useState } from "react";
import { schools, schoolsAlphabetical } from "@/lib/schools";
import { followPromo, safeArticleUrl, type Promo } from "@/lib/articleBlocks";

export type SearchResult = { title: string; url: string; image?: string };
export function ArticlePicker({ context, onChoose, onClose }: {
  context: "link" | "related"; onChoose: (item: SearchResult) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setResults([]);
    setFailed(false);
    if (query.trim().length < 2) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/article-search?q=" + encodeURIComponent(query), { signal: abort.signal });
        if (!response.ok) throw new Error();
        setResults(await response.json());
      } catch { if (!abort.signal.aborted) setFailed(true); }
    }, 250);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query]);
  const hubs = context === "link" && query.trim().length >= 2 ? schoolsAlphabetical.filter(school =>
    school.name.toLowerCase().includes(query.trim().toLowerCase())).map(school => ({
      title: school.name + " School Hub", url: "/schools/" + school.slug,
    })) : [];
  const url = safeArticleUrl(query);
  return <dialog open className="cms-editor-dialog" aria-label={context === "link" ? "Insert link" : "Related story"}>
    <label>{context === "link" ? "Paste a URL or search articles and teams" : "Search published articles"}
      <input autoFocus value={query} onChange={e => setQuery(e.target.value)} />
    </label>
    {context === "link" && url && <button type="button" onClick={() => onChoose({ title: query, url })}>Insert URL</button>}
    {failed && <p role="alert">Article search is unavailable.</p>}
    <ul>{[...hubs, ...results].map(item => <li key={item.url}><button type="button" onClick={() => onChoose(item)}>{item.title}</button></li>)}</ul>
    <button type="button" onClick={onClose}>Cancel</button>
  </dialog>;
}

export function PromoEditor({ promo, school, onSave, onClose }: {
  promo: Promo; school?: string; onSave: (promo: Promo) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(promo);
  const [handle, setHandle] = useState(promo.kind === "school-x" ? promo.url.split("/").pop() || "" : "");
  return <dialog open className="cms-editor-dialog" aria-label="Edit promo card">
    <form onSubmit={event => {
      event.preventDefault();
      const cleaned = handle.trim().replace(/^@/, "");
      if (value.kind === "school-x") {
        if (!/^[\w]{1,15}$/.test(cleaned)) return;
        const account = schools.find(item => item.xHandle?.toLowerCase() === cleaned.toLowerCase());
        onSave({ ...value, title: "Follow @" + (account?.xDisplayHandle || account?.xHandle || cleaned), url: "https://x.com/" + (account?.xHandle || cleaned) });
      } else if (safeArticleUrl(value.url)) onSave(value);
    }}>
      {value.kind === "school-x" ? <label>{school || "School"} X handle
        <input required pattern="@?[A-Za-z0-9_]{1,15}" value={handle} onChange={e => setHandle(e.target.value)} />
      </label> : <>
        {(["title", "subtitle", "button", "url"] as const).map((key, index) => <label key={key}>
          {["Title", "Subtitle", "Button Text", "URL"][index]}
          <input required={key !== "subtitle"} value={value[key]} onChange={e => setValue({ ...value, [key]: e.target.value })} />
        </label>)}
        <label>Style <select value={value.style} onChange={e => setValue({ ...value, style: e.target.value })}>
          <option value="dark">Dark</option><option value="light">Light Editorial</option><option value="red">Red Accent</option>
        </select></label>
      </>}
      {value.kind !== "school-x" && value.url && !safeArticleUrl(value.url) && <p role="alert">Enter a valid web URL.</p>}
      <button>Save card</button> <button type="button" onClick={onClose}>Cancel</button>
    </form>
  </dialog>;
}

export function schoolPromo(name: string): Promo {
  const school = schools.find(item => item.name === name);
  return { ...followPromo, kind: "school-x", url: school?.xHandle ? "https://x.com/" + school.xHandle : "",
    subtitle: `Daily ${school?.name ? school.name + " " : ""}football, basketball & recruiting updates.` };
}
