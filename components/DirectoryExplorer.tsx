"use client";

import { useState, type ReactNode } from "react";

export type DirectoryEntry = { id: string; searchable: string; filters: string[]; card: ReactNode };

export function DirectoryExplorer({ entries, filters, placeholder, gridClass }: {
  entries: DirectoryEntry[]; filters: string[]; placeholder?: string; gridClass: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(filters[0]);
  const search = query.trim().toLowerCase();
  const shown = entries.filter(entry =>
    (filter === filters[0] || entry.filters.includes(filter)) && entry.searchable.toLowerCase().includes(search),
  );
  return <>
    <div className="directory-controls">
      {placeholder && <input type="search" aria-label={placeholder} placeholder={placeholder} value={query} onChange={e => setQuery(e.target.value)} />}
      <div className="filter-pills" aria-label="Filters">{filters.map(label =>
        <button key={label} type="button" aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>,
      )}</div>
    </div>
    {shown.length ? <div className={gridClass}>{shown.map(entry => <div key={entry.id}>{entry.card}</div>)}</div>
      : <p role="status">No results match your search.</p>}
  </>;
}
