export type SchoolBeat = { name: string; slug: string; xHandle?: string };
type SchoolBrand = { shortName: string; mascot: string; primary: string; secondary: string; espnId: number; banner?: string };
export type School = SchoolBeat & { conference: string; brand?: SchoolBrand };

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
  { name: "Arizona State", slug: "arizona-state", conference: "Big 12", brand: { shortName: "ASU", mascot: "Sun Devils", primary: "#8C1D40", secondary: "#FFC627", espnId: 9 } },
  { name: "Iowa State", slug: "iowa-state", conference: "Big 12", brand: { shortName: "ISU", mascot: "Cyclones", primary: "#C8102E", secondary: "#F1BE48", espnId: 66 } },
  { name: "Cincinnati", slug: "cincinnati", conference: "Big 12", brand: { shortName: "CIN", mascot: "Bearcats", primary: "#E00122", secondary: "#000000", espnId: 2132 } },
  { name: "TCU", slug: "tcu", conference: "Big 12", brand: { shortName: "TCU", mascot: "Horned Frogs", primary: "#4D1979", secondary: "#A3A9AC", espnId: 2628 } },
  { name: "Colorado", slug: "colorado", conference: "Big 12", brand: { shortName: "CU", mascot: "Buffaloes", primary: "#CFB87C", secondary: "#000000", espnId: 38, banner: "#000000" } },
  { name: "Kansas State", slug: "kansas-state", conference: "Big 12", brand: { shortName: "K-State", mascot: "Wildcats", primary: "#512888", secondary: "#D1D1D1", espnId: 2306 } },
  { name: "UCLA", slug: "ucla", conference: "Big Ten", brand: { shortName: "UCLA", mascot: "Bruins", primary: "#2774AE", secondary: "#FFD100", espnId: 26, banner: "#102C46" } },
  { name: "Wisconsin", slug: "wisconsin", conference: "Big Ten", brand: { shortName: "WIS", mascot: "Badgers", primary: "#C5050C", secondary: "#FFFFFF", espnId: 275 } },
  { name: "Minnesota", slug: "minnesota", conference: "Big Ten", brand: { shortName: "MINN", mascot: "Golden Gophers", primary: "#7A0019", secondary: "#FFCC33", espnId: 135 } },
  { name: "Washington", slug: "washington", conference: "Big Ten", brand: { shortName: "UW", mascot: "Huskies", primary: "#4B2E83", secondary: "#B7A57A", espnId: 264 } },
  { name: "Northwestern", slug: "northwestern", conference: "Big Ten", brand: { shortName: "NU", mascot: "Wildcats", primary: "#4E2A84", secondary: "#FFFFFF", espnId: 77 } },
  { name: "Maryland", slug: "maryland", conference: "Big Ten", brand: { shortName: "UMD", mascot: "Terrapins", primary: "#E03A3E", secondary: "#FFD520", espnId: 120, banner: "#111111" } },
  { name: "Purdue", slug: "purdue", conference: "Big Ten", brand: { shortName: "PUR", mascot: "Boilermakers", primary: "#CEB888", secondary: "#000000", espnId: 2509, banner: "#000000" } },
  { name: "Duke", slug: "duke", conference: "ACC", brand: { shortName: "DUKE", mascot: "Blue Devils", primary: "#003087", secondary: "#FFFFFF", espnId: 150 } },
  { name: "Stanford", slug: "stanford", conference: "ACC", brand: { shortName: "STAN", mascot: "Cardinal", primary: "#8C1515", secondary: "#FFFFFF", espnId: 24 } },
  { name: "Virginia", slug: "virginia", conference: "ACC", brand: { shortName: "UVA", mascot: "Cavaliers", primary: "#232D4B", secondary: "#F84C1E", espnId: 258 } },
  { name: "Boston College", slug: "boston-college", conference: "ACC", brand: { shortName: "BC", mascot: "Eagles", primary: "#98002E", secondary: "#BC9B6A", espnId: 103 } },
  { name: "Pitt", slug: "pitt", conference: "ACC", brand: { shortName: "PITT", mascot: "Panthers", primary: "#003594", secondary: "#FFB81C", espnId: 221 } },
  { name: "Syracuse", slug: "syracuse", conference: "ACC", brand: { shortName: "CUSE", mascot: "Orange", primary: "#F76900", secondary: "#000E54", espnId: 183, banner: "#000E54" } },
  { name: "Cal", slug: "cal", conference: "ACC", brand: { shortName: "CAL", mascot: "Golden Bears", primary: "#003262", secondary: "#FDB515", espnId: 25 } },
  { name: "Georgia Tech", slug: "georgia-tech", conference: "ACC", brand: { shortName: "GT", mascot: "Yellow Jackets", primary: "#B3A369", secondary: "#003057", espnId: 59, banner: "#003057" } },
  { name: "Boise State", slug: "boise-state", conference: "Pac-12", brand: { shortName: "BSU", mascot: "Broncos", primary: "#0033A0", secondary: "#D64309", espnId: 68 } },
  { name: "San Diego State", slug: "san-diego-state", conference: "Pac-12", brand: { shortName: "SDSU", mascot: "Aztecs", primary: "#A6192E", secondary: "#000000", espnId: 21 } },
  { name: "Texas State", slug: "texas-state", conference: "Pac-12", brand: { shortName: "TXST", mascot: "Bobcats", primary: "#501214", secondary: "#8D734A", espnId: 326 } },
  { name: "Utah State", slug: "utah-state", conference: "Pac-12", brand: { shortName: "USU", mascot: "Aggies", primary: "#0F2439", secondary: "#8A8D8F", espnId: 328 } },
  { name: "Fresno State", slug: "fresno-state", conference: "Pac-12", brand: { shortName: "FRES", mascot: "Bulldogs", primary: "#DB0032", secondary: "#13284C", espnId: 278 } },
  { name: "Washington State", slug: "washington-state", conference: "Pac-12", brand: { shortName: "WSU", mascot: "Cougars", primary: "#981E32", secondary: "#5E6A71", espnId: 265 } },
  { name: "Colorado State", slug: "colorado-state", conference: "Pac-12", brand: { shortName: "CSU", mascot: "Rams", primary: "#1E4D2B", secondary: "#C8C372", espnId: 36 } },
];
export const featuredSchoolCount = originalSchools.length;
export const schools: readonly School[] = [
  ...originalSchools.map(school => ({ ...school, conference: originalConferences[school.slug] })),
  ...newSchools,
];

export const compareSchoolNames = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" });

export const schoolsAlphabetical = [...schools].sort(compareSchoolNames);

const editorialSchoolOptions = [...schoolsAlphabetical, { name: "Recruiting", slug: "recruiting" }].sort(compareSchoolNames);

export function articleSchoolOptions(savedValue: string) {
  return savedValue && !editorialSchoolOptions.some(({ name }) => name === savedValue)
    ? [...editorialSchoolOptions, { name: savedValue, slug: savedValue }].sort(compareSchoolNames)
    : editorialSchoolOptions;
}

export const getSchoolBySlug = (slug: string) =>
  schools.find((school) => school.slug === slug);
