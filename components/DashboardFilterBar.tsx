"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { dashboardFilters, dashboardHref, dashboardSorts, type DashboardFilters } from "@/lib/dashboardFilters";
import { storyLabels } from "@/lib/storyLabels";

type Option = { value: string; label: string };
type Props = { filters: DashboardFilters; schools: string[]; authors: Option[]; categories: string[] };

const filterNames = ["q", "school", "author", "category", "label", "partner", "featured", "from", "to", "sort"] as const;

export function DashboardFilterBar({ filters, schools, authors, categories }: Props) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState(filters.q);

  const cancelSearch = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    cancelSearch();
    setSearch(filters.q);
    return cancelSearch;
  }, [filters]);

  function applyFilters() {
    cancelSearch();
    if (!form.current || !form.current.reportValidity()) return;
    const formData = new FormData(form.current);
    const values = Object.fromEntries(filterNames.map(name => [name, String(formData.get(name) ?? "")]));
    const next = dashboardFilters({ ...values, status: filters.status });
    router.push(dashboardHref(next), { scroll: false });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters();
  }

  const select = (name: keyof DashboardFilters, label: string, placeholder: string, options: Option[]) => <label>
    {label}
    <select key={String(filters[name])} name={name} defaultValue={filters[name]} onChange={applyFilters}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
  const namesToOptions = (items: string[]) => items.map(name => ({ value: name, label: name }));
  const flags = (yes: string, no: string) => [{ value: "yes", label: yes }, { value: "no", label: no }];
  const clearHref = dashboardHref(dashboardFilters({ status: filters.status }));

  return <form ref={form} className="cms-article-filters" role="search" aria-label="Filter articles"
    method="get" action="/dashboard" onSubmit={submit}>
    {filters.status !== "all" && <input type="hidden" name="status" value={filters.status} />}
    <label>Search articles
      <input type="search" name="q" value={search} maxLength={120} placeholder="Headline or slug"
        onChange={event => {
          setSearch(event.target.value);
          cancelSearch();
          timer.current = setTimeout(applyFilters, 300);
        }} />
    </label>
    {select("school", "School", "All schools", namesToOptions(schools))}
    {select("author", "Author", "All authors", authors)}
    {select("category", "Category", "All categories", namesToOptions(categories))}
    {select("label", "Label", "All labels", namesToOptions(Object.keys(storyLabels)))}
    {select("partner", "Sponsored / partner", "All", flags("Partner only", "Non-partner"))}
    {select("featured", "Feature in Top Stories", "All", flags("Featured", "Not featured"))}
    <label>Published from
      <input key={filters.from} type="date" name="from" defaultValue={filters.from} onChange={applyFilters} />
    </label>
    <label>Published to
      <input key={filters.to} type="date" name="to" defaultValue={filters.to} onChange={applyFilters} />
    </label>
    {select("sort", "Sort by", "", dashboardSorts.map(([value, label]) => ({ value, label })))}
    <div className="cms-filter-actions">
      <button type="submit" className="outline-button">Apply filters</button>
      <Link href={clearHref} scroll={false} onClick={cancelSearch}>Clear filters</Link>
    </div>
  </form>;
}
