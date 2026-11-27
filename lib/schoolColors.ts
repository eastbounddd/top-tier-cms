import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CSSProperties } from "react";

type SchoolColors = { primary: string; secondary: string; abbr: string; dark?: string; banner?: string; whiteBannerText?: boolean; whiteBannerLogo?: boolean; followInk?: string; logoSrc?: string };

export const SCHOOL_COLORS: Record<string, SchoolColors> = {
  alabama: { primary: "#9E1B32", secondary: "#FFFFFF", whiteBannerText: true, abbr: "ALA" },
  arkansas: { primary: "#9D2235", secondary: "#FFFFFF", whiteBannerText: true, abbr: "ARK" },
  auburn: { primary: "#0C2340", secondary: "#E87722", followInk: "#0C2340", abbr: "AUB" },
  baylor: { primary: "#154734", secondary: "#FFB81C", banner: "#FFB81C", abbr: "BU" },
  byu: { primary: "#0047BA", secondary: "#FFFFFF", whiteBannerText: true, abbr: "BYU" },
  clemson: { primary: "#F66733", secondary: "#522D80", dark: "#522D80", abbr: "CLEM" },
  fsu: { primary: "#782F40", secondary: "#CEB888", banner: "#CEB888", abbr: "FSU" },
  georgia: { primary: "#BA0C2F", secondary: "#000000", abbr: "UGA" },
  illinois: { primary: "#FF5F05", secondary: "#13294B", dark: "#13294B", banner: "#13294B", whiteBannerText: true, abbr: "ILL" },
  kansas: { primary: "#0051BA", secondary: "#E8000D", whiteBannerText: true, abbr: "KU" },
  kentucky: { primary: "#0033A0", secondary: "#FFFFFF", whiteBannerText: true, abbr: "UK" },
  marshall: { primary: "#00B140", secondary: "#FFFFFF", dark: "#005F28", whiteBannerText: true, abbr: "MU" },
  michigan: { primary: "#00274C", secondary: "#FFCB05", abbr: "UM" },
  "mississippi-state": { primary: "#660000", secondary: "#FFFFFF", whiteBannerText: true, abbr: "MSU" },
  missouri: { primary: "#000000", secondary: "#F1B82D", banner: "#F1B82D", abbr: "MIZ" },
  nebraska: { primary: "#E41C38", secondary: "#F5F1E7", dark: "#B30E2A", banner: "#F5F1E7", abbr: "NEB" },
  "notre-dame": { primary: "#0C2340", secondary: "#C99700", banner: "#C99700", abbr: "ND" },
  oklahoma: { primary: "#841617", secondary: "#FFF4D8", banner: "#FFF4D8", abbr: "OU" },
  "oregon-state": { primary: "#DC4405", secondary: "#000000", dark: "#000000", whiteBannerText: true, abbr: "OSU" },
  tennessee: { primary: "#FF8200", secondary: "#FFFFFF", dark: "#8A4100", banner: "#111111", abbr: "TENN" },
  tulane: { primary: "#006747", secondary: "#43B3AE", whiteBannerText: true, abbr: "TU" },
  utah: { primary: "#CC0000", secondary: "#000000", whiteBannerText: true, abbr: "UTAH" },
  vanderbilt: { primary: "#1C1C1C", secondary: "#CFAE70", abbr: "VU" },
  "virginia-tech": { primary: "#630031", secondary: "#CF4420", whiteBannerText: true, abbr: "VT" },
  lsu: { primary: "#461D7C", secondary: "#FDD023", followInk: "#2E1065", abbr: "LSU" },
  "texas": { primary: "#BF5700", secondary: "#FFFFFF", whiteBannerText: true, whiteBannerLogo: true, abbr: "TEX" },
  "florida": { primary: "#0021A5", secondary: "#FA4616", whiteBannerText: true, abbr: "FLO" },
  "ole-miss": { primary: "#14213D", secondary: "#FFFFFF", whiteBannerText: true, abbr: "MISS" },
  "south-carolina": { primary: "#73000A", secondary: "#FFFFFF", whiteBannerText: true, abbr: "SC" },
  "texas-am": { primary: "#500000", secondary: "#FFFFFF", whiteBannerText: true, whiteBannerLogo: true, abbr: "TAMU" },
  "ohio-state": { primary: "#BB0000", secondary: "#FFFFFF", whiteBannerText: true, whiteBannerLogo: true, abbr: "OSU" },
  "indiana": { primary: "#990000", secondary: "#FFFFFF", whiteBannerText: true, whiteBannerLogo: true, abbr: "IND" },
  "oregon": { primary: "#154733", secondary: "#FEE123", whiteBannerText: true, abbr: "ORE" },
  "iowa": { primary: "#111111", secondary: "#FFCD00", whiteBannerText: true, whiteBannerLogo: true, abbr: "IOW" },
  "usc": { primary: "#990000", secondary: "#FFCC00", whiteBannerText: true, abbr: "USC" },
  "rutgers": { primary: "#CC0033", secondary: "#FFFFFF", whiteBannerText: true, abbr: "RUT" },
  "penn-state": { primary: "#041E42", secondary: "#FFFFFF", whiteBannerText: true, abbr: "PSU" },
  "michigan-state": { primary: "#18453B", secondary: "#FFFFFF", whiteBannerText: true, whiteBannerLogo: true, abbr: "MSU" },
  "west-virginia": { primary: "#002855", secondary: "#EAAA00", whiteBannerText: true, whiteBannerLogo: true, abbr: "WVU" },
  "arizona": { primary: "#0C234B", secondary: "#FFFFFF", whiteBannerText: true, abbr: "ARI" },
  "houston": { primary: "#C8102E", secondary: "#FFFFFF", whiteBannerText: true, abbr: "HOU" },
  "oklahoma-state": { primary: "#FF7300", secondary: "#000000", whiteBannerText: true, abbr: "OSU" },
  "ucf": { primary: "#111111", secondary: "#BA9B37", whiteBannerText: true, abbr: "UCF" },
  "texas-tech": { primary: "#CC0000", secondary: "#FFFFFF", banner: "#111111", whiteBannerText: true, abbr: "TTU" },
  "wake-forest": { primary: "#111111", secondary: "#9E7E38", whiteBannerText: true, abbr: "WF" },
  "miami": { primary: "#005030", secondary: "#F47321", whiteBannerText: true, abbr: "MIA" },
  "louisville": { primary: "#AD0000", secondary: "#FFFFFF", whiteBannerText: true, abbr: "LOU" },
  "smu": { primary: "#0033A0", secondary: "#FFFFFF", whiteBannerText: true, abbr: "SMU" },
  "nc-state": { primary: "#CC0000", secondary: "#FFFFFF", whiteBannerText: true, abbr: "NCSU" },
  "north-carolina": { primary: "#13294B", secondary: "#4B9CD3", whiteBannerText: true, abbr: "UNC" },
  "new-mexico": { primary: "#BA0C2F", secondary: "#FFFFFF", whiteBannerText: true, abbr: "UNM" },
  "north-texas": { primary: "#00853E", secondary: "#FFFFFF", whiteBannerText: true, whiteBannerLogo: true, abbr: "UNT" },
  "unlv": { primary: "#CF0A2C", secondary: "#FFFFFF", whiteBannerText: true, abbr: "UNL" },
};

const defaultColors: SchoolColors = { primary: "#C81E25", secondary: "#FFFFFF", abbr: "TT" };
export const schoolColors = (slug?: string) => SCHOOL_COLORS[slug ?? ""] ?? defaultColors;

const luminance = (hex: string) => [1, 3, 5].reduce((value, start, index) => {
  const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value + [0.2126, 0.7152, 0.0722][index] * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
}, 0);

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

export function schoolTheme(slug?: string): CSSProperties {
  const { primary, secondary, dark, banner, whiteBannerText, followInk: preferredFollowInk } = schoolColors(slug);
  const ink = dark ?? primary;
  const tint = contrast(secondary, ink) >= 4.5 ? secondary : "#FFFFFF";
  const pillInk = contrast(secondary, "#111111") >= 4.5 ? "#111111" : "#FFFFFF";
  const badgeInk = contrast(secondary, primary) >= 4.5 ? secondary :
    contrast("#FFFFFF", primary) >= 4.5 ? "#FFFFFF" : "#111111";
  const bannerFill = banner ?? (whiteBannerText ? primary : ink);
  const whiteContrast = contrast("#FFFFFF", bannerFill);
  const bannerText = whiteBannerText || whiteContrast >= 4.5 ? "#FFFFFF" : "#111111";
  const followFill = whiteBannerText ? "#111111" : contrast(secondary, bannerFill) < 2 ? bannerText : secondary;
  const followInk = whiteBannerText ? "#FFFFFF" : followFill === secondary ? preferredFollowInk ?? pillInk : bannerFill;
  return {
    "--school-primary": primary, "--school-secondary": secondary, "--school-ink": ink,
    "--school-tint": tint, "--school-pill-ink": pillInk, "--school-badge-ink": badgeInk,
    "--school-banner-fill": bannerFill, "--school-banner-text": bannerText, "--school-banner-muted": bannerText,
    "--school-banner-stripe": banner && banner !== primary ? primary : secondary,
    "--school-follow-fill": followFill, "--school-follow-ink": followInk,
    ...(bannerText === "#FFFFFF" && whiteContrast < 4.5 ? { "--school-banner-shadow": "0 1px 2px rgba(0,0,0,.18)" } : {}),
  } as CSSProperties;
}

export function schoolBannerLogo(slug: string) {
  const path = `/images/schools/banner/${slug}.webp`;
  return existsSync(join(process.cwd(), "public", path)) ? path : schoolLogo(slug);
}

export function schoolLogo(slug: string) {
  const { logoSrc } = schoolColors(slug);
  if (logoSrc) return logoSrc;
  return ["svg", "png", "webp"].map(ext => `/images/schools/${slug}.${ext}`)
    .find(path => existsSync(join(process.cwd(), "public", path)));
}

export function schoolXAvatar(slug: string) {
  const path = `/images/school-x/${slug}.webp`;
  return existsSync(join(process.cwd(), "public", path)) ? path : undefined;
}
