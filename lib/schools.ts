export type SchoolBeat = { name: string; slug: string; xHandle?: string };
export type School = SchoolBeat & { conference: string };

const originalSchools: readonly SchoolBeat[] = [
  { name: "Auburn", slug: "auburn", xHandle: "toptierauburn" },
  { name: "Arkansas", slug: "arkansas", xHandle: "toptierarkansas" },
  { name: "Utah", slug: "utah", xHandle: "toptierutes" },
  { name: "Florida State", slug: "fsu", xHandle: "TopTierNoles" },
  { name: "Michigan", slug: "michigan", xHandle: "toptieruofm" },
  { name: "Tulane", slug: "tulane", xHandle: "toptiertulane" },
  { name: "Georgia", slug: "georgia", xHandle: "toptieruga" },
  { name: "Baylor", slug: "baylor", xHandle: "TopTierBaylor" },
  { name: "Vanderbilt", slug: "vanderbilt", xHandle: "toptiervandy" },
  { name: "Oklahoma", slug: "oklahoma", xHandle: "TopTierOklahoma" },
  { name: "Kansas", slug: "kansas", xHandle: "TopTierKansas" },
  { name: "Virginia Tech", slug: "virginia-tech", xHandle: "TopTierHokies" },
  { name: "Alabama", slug: "alabama", xHandle: "toptieralabama" },
  { name: "BYU", slug: "byu", xHandle: "toptiercougs" },
  { name: "Clemson", slug: "clemson", xHandle: "TopTierCU" },
  { name: "Nebraska", slug: "nebraska", xHandle: "TopTierHuskers" },
  { name: "Oregon State", slug: "oregon-state", xHandle: "toptierbeavers" },
  { name: "Illinois", slug: "illinois", xHandle: "toptierillinois" },
  { name: "Tennessee", slug: "tennessee", xHandle: "TopTierVols" },
  { name: "Kentucky", slug: "kentucky", xHandle: "toptierbbn" },
  { name: "Missouri", slug: "missouri", xHandle: "TopTierMizzou" },
  { name: "Marshall", slug: "marshall", xHandle: "TopTierMarshall" },
  { name: "Notre Dame", slug: "notre-dame", xHandle: "TopTierIrish" },
  { name: "Mississippi State", slug: "mississippi-state", xHandle: "toptiermissst" },
  { name: "LSU", slug: "lsu", xHandle: "TopTierLSU" },
];

const originalConferences: Record<string, string> = {
  auburn:"SEC", arkansas:"SEC", utah:"Big 12", fsu:"ACC", michigan:"Big Ten", tulane:"AAC",
  georgia:"SEC", baylor:"Big 12", vanderbilt:"SEC", oklahoma:"SEC", kansas:"Big 12", "virginia-tech":"ACC",
  alabama:"SEC", byu:"Big 12", clemson:"ACC", nebraska:"Big Ten", "oregon-state":"Pac-12",
  illinois:"Big Ten", tennessee:"SEC", kentucky:"SEC", missouri:"SEC", marshall:"Sun Belt",
  "notre-dame":"Independent", "mississippi-state":"SEC", lsu:"SEC",
};

const newSchools: readonly School[] = [
  { name: "Texas", slug: "texas", conference: "SEC", xHandle: "TopTierUT" },
  { name: "Florida", slug: "florida", conference: "SEC", xHandle: "toptiergators" },
  { name: "Ole Miss", slug: "ole-miss", conference: "SEC" },
  { name: "South Carolina", slug: "south-carolina", conference: "SEC", xHandle: "toptierusc" },
  { name: "Texas A&M", slug: "texas-am", conference: "SEC", xHandle: "toptiertexasam" },
  { name: "Ohio State", slug: "ohio-state", conference: "Big Ten", xHandle: "toptierbuckeyes" },
  { name: "Indiana", slug: "indiana", conference: "Big Ten", xHandle: "toptierindiana" },
  { name: "Oregon", slug: "oregon", conference: "Big Ten", xHandle: "toptieroregon" },
  { name: "Iowa", slug: "iowa", conference: "Big Ten", xHandle: "toptierhawkeyes" },
  { name: "USC", slug: "usc", conference: "Big Ten", xHandle: "toptiertrojans" },
  { name: "Rutgers", slug: "rutgers", conference: "Big Ten" },
  { name: "Penn State", slug: "penn-state", conference: "Big Ten", xHandle: "toptierpennst" },
  { name: "Michigan State", slug: "michigan-state", conference: "Big Ten", xHandle: "toptierspartans" },
  { name: "West Virginia", slug: "west-virginia", conference: "Big 12" },
  { name: "Arizona", slug: "arizona", conference: "Big 12", xHandle: "toptierarizona" },
  { name: "Houston", slug: "houston", conference: "Big 12", xHandle: "toptierhouston" },
  { name: "Oklahoma State", slug: "oklahoma-state", conference: "Big 12", xHandle: "toptierosu" },
  { name: "UCF", slug: "ucf", conference: "Big 12", xHandle: "toptierucf" },
  { name: "Texas Tech", slug: "texas-tech", conference: "Big 12", xHandle: "toptierttu" },
  { name: "Wake Forest", slug: "wake-forest", conference: "ACC", xHandle: "toptierdeacons" },
  { name: "Miami", slug: "miami", conference: "ACC" },
  { name: "Louisville", slug: "louisville", conference: "ACC", xHandle: "toptieruofl" },
  { name: "SMU", slug: "smu", conference: "ACC", xHandle: "toptiersmu" },
  { name: "NC State", slug: "nc-state", conference: "ACC", xHandle: "toptierncstate" },
  { name: "North Carolina", slug: "north-carolina", conference: "ACC", xHandle: "toptierunc" },
  { name: "New Mexico", slug: "new-mexico", conference: "Mountain West" },
  { name: "North Texas", slug: "north-texas", conference: "AAC", xHandle: "toptiernorthtex" },
  { name: "UNLV", slug: "unlv", conference: "Mountain West", xHandle: "toptierunlv" },
];
export const featuredSchoolCount = originalSchools.length;
export const schools: readonly School[] = [
  ...originalSchools.map(school => ({ ...school, conference: originalConferences[school.slug] })),
  ...newSchools,
];

export const articleSchoolOptions = [
  ...schools.map(({ name, slug }) => ({ name, slug })),
  { name: "Recruiting", slug: "recruiting" },
] as const;

export const getSchoolBySlug = (slug: string) =>
  schools.find((school) => school.slug === slug);
