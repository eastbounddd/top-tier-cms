export const schools = [
  { name: "Auburn", slug: "auburn", xHandle: "toptierauburn" },
  { name: "Arkansas", slug: "arkansas", xHandle: "toptierarkansas" },
  { name: "Utah", slug: "utah", xHandle: "toptierutes" },
  { name: "Florida State", slug: "fsu", xHandle: "toptiernoles" },
  { name: "Michigan", slug: "michigan", xHandle: "toptieruofm" },
  { name: "Tulane", slug: "tulane", xHandle: "toptiertulane" },
  { name: "Georgia", slug: "georgia", xHandle: "toptieruga" },
  { name: "Iowa State", slug: "iowa-state", xHandle: "toptiercyclones" },
  { name: "Baylor", slug: "baylor", xHandle: "toptierbaylor" },
  { name: "Vanderbilt", slug: "vanderbilt", xHandle: "toptiervandy" },
  { name: "Oklahoma", slug: "oklahoma", xHandle: "toptieroklahoma" },
  { name: "Alabama", slug: "alabama", xHandle: "toptieralabama" },
  { name: "BYU", slug: "byu", xHandle: "toptiercougs" },
  { name: "Clemson", slug: "clemson", xHandle: "TopTierCU" },
  { name: "Nebraska", slug: "nebraska", xHandle: "TopTierHuskers" },
  { name: "Tennessee", slug: "tennessee", xHandle: "TopTierVols" },
  { name: "Kentucky", slug: "kentucky", xHandle: "toptierbbn" },
  { name: "Missouri", slug: "missouri", xHandle: "TopTierMizzou" },
  { name: "Marshall", slug: "marshall", xHandle: "TopTierMarshall" },
  { name: "Mississippi State", slug: "mississippi-state", xHandle: "toptiermissst" },
] as const;

export const articleSchoolOptions = [
  ...schools.map(({ name, slug }) => ({ name, slug })),
  { name: "Recruiting", slug: "recruiting" },
] as const;

export const getSchoolBySlug = (slug: string) =>
  schools.find((school) => school.slug === slug);
