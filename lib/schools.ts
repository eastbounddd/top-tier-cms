export const schools = [
  { name: "Auburn", slug: "auburn", xHandle: "toptierauburn" },
  { name: "Arkansas", slug: "arkansas", xHandle: "toptierarkansas" },
  { name: "Utah", slug: "utah", xHandle: "toptierutes" },
  { name: "Florida State", slug: "fsu", xHandle: "toptiernoles" },
  { name: "Michigan", slug: "michigan", xHandle: "toptieruofm" },
  { name: "Tulane", slug: "tulane", xHandle: "toptiertulane" },
  { name: "Georgia", slug: "georgia", xHandle: "toptieruga" },
  { name: "Baylor", slug: "baylor", xHandle: "toptierbaylor" },
  { name: "Vanderbilt", slug: "vanderbilt", xHandle: "toptiervandy" },
  { name: "Oklahoma", slug: "oklahoma", xHandle: "toptieroklahoma" },
  { name: "Alabama", slug: "alabama", xHandle: "toptieralabama" },
  { name: "BYU", slug: "byu", xHandle: "toptiercougs" },
  { name: "Mississippi State", slug: "mississippi-state", xHandle: "toptiermissst" },
] as const;

export const getSchoolBySlug = (slug: string) =>
  schools.find((school) => school.slug === slug);
