const retiredWriters: Readonly<Record<string, string>> = {
  "kary-haeth-ca0cf206": "kary-heath-ab2ac1d3",
  "kary-haeth": "kary-heath-ab2ac1d3",
  "kary-heath": "kary-heath-ab2ac1d3",
};

export const canonicalWriterSlug = (slug: string) => Object.hasOwn(retiredWriters, slug) ? retiredWriters[slug] : slug;
export const writerPath = (slug: string) => `/writers/${encodeURIComponent(canonicalWriterSlug(slug))}`;
