export const schools = [
  { name: "Auburn", slug: "auburn" },
  { name: "Arkansas", slug: "arkansas" },
  { name: "Utah", slug: "utah" },
  { name: "Florida State", slug: "fsu" },
  { name: "Michigan", slug: "michigan" },
  { name: "Tulane", slug: "tulane" },
  { name: "Georgia", slug: "georgia" },
  { name: "Baylor", slug: "baylor" },
  { name: "Vanderbilt", slug: "vanderbilt" },
  { name: "Oklahoma", slug: "oklahoma" },
  { name: "Alabama", slug: "alabama" },
  { name: "BYU", slug: "byu" },
] as const;

export const getSchoolBySlug = (slug: string) =>
  schools.find((school) => school.slug === slug);
