import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CSSProperties } from "react";

type SchoolColors = { primary: string; secondary: string; abbr: string; dark?: string; banner?: string; logoSrc?: string };

export const SCHOOL_COLORS: Record<string, SchoolColors> = {
  alabama: { primary: "#9E1B32", secondary: "#FFFFFF", banner: "#FFFFFF", abbr: "ALA" },
  arkansas: { primary: "#9D2235", secondary: "#FFFFFF", banner: "#FFFFFF", abbr: "ARK" },
  auburn: { primary: "#0C2340", secondary: "#E87722", banner: "#E87722", abbr: "AUB" },
  baylor: { primary: "#154734", secondary: "#FFB81C", banner: "#FFB81C", abbr: "BU" },
  byu: { primary: "#002E5D", secondary: "#FFFFFF", banner: "#FFFFFF", abbr: "BYU" },
  clemson: { primary: "#F66733", secondary: "#522D80", dark: "#522D80", abbr: "CLEM" },
  fsu: { primary: "#782F40", secondary: "#CEB888", banner: "#CEB888", abbr: "FSU" },
  georgia: { primary: "#BA0C2F", secondary: "#000000", abbr: "UGA" },
  illinois: { primary: "#E84A27", secondary: "#13294B", dark: "#13294B", abbr: "ILL" },
  kansas: { primary: "#0051BA", secondary: "#E8000D", banner: "#FFFFFF", abbr: "KU" },
  kentucky: { primary: "#0033A0", secondary: "#FFFFFF", banner: "#FFFFFF", abbr: "UK" },
  marshall: { primary: "#00B140", secondary: "#FFFFFF", dark: "#005F28", banner: "#FFFFFF", abbr: "MU" },
  michigan: { primary: "#00274C", secondary: "#FFCB05", abbr: "UM" },
  "mississippi-state": { primary: "#5D1727", secondary: "#FFFFFF", banner: "#FFFFFF", abbr: "MSU" },
  missouri: { primary: "#000000", secondary: "#F1B82D", banner: "#F1B82D", abbr: "MIZ" },
  nebraska: { primary: "#E41C38", secondary: "#F5F1E7", dark: "#B30E2A", banner: "#F5F1E7", abbr: "NEB" },
  "notre-dame": { primary: "#0C2340", secondary: "#C99700", banner: "#C99700", abbr: "ND" },
  oklahoma: { primary: "#841617", secondary: "#FFF4D8", banner: "#FFF4D8", abbr: "OU" },
  "oregon-state": { primary: "#DC4405", secondary: "#000000", dark: "#000000", banner: "#FFFFFF", abbr: "OSU" },
  tennessee: { primary: "#FF8200", secondary: "#FFFFFF", dark: "#8A4100", banner: "#111111", abbr: "TENN" },
  tulane: { primary: "#006747", secondary: "#43B3AE", banner: "#FFFFFF", abbr: "TU" },
  utah: { primary: "#CC0000", secondary: "#000000", banner: "#FFFFFF", abbr: "UTAH" },
  vanderbilt: { primary: "#1C1C1C", secondary: "#CFAE70", abbr: "VU" },
  "virginia-tech": { primary: "#630031", secondary: "#CF4420", banner: "#FFFFFF", abbr: "VT" },
  lsu: { primary: "#461D7C", secondary: "#FDD023", abbr: "LSU" },
  texas: { primary: "#BF5700", secondary: "#FFFFFF", dark: "#9D4500", abbr: "TEX" },
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
  const { primary, secondary, dark, banner } = schoolColors(slug);
  const ink = dark ?? primary;
  const tint = contrast(secondary, ink) >= 4.5 ? secondary : "#FFFFFF";
  const pillInk = contrast(secondary, "#111111") >= 4.5 ? "#111111" : "#FFFFFF";
  const badgeInk = contrast(secondary, primary) >= 4.5 ? secondary :
    contrast("#FFFFFF", primary) >= 4.5 ? "#FFFFFF" : "#111111";
  const bannerFill = banner ?? ink;
  const bannerText = contrast("#FFFFFF", bannerFill) >= 4.5 ? "#FFFFFF" :
    contrast(ink, bannerFill) >= 4.5 ? ink : "#111111";
  const bannerMuted = contrast(secondary, bannerFill) >= 4.5 ? secondary : bannerText;
  const followFill = contrast(secondary, bannerFill) < 2 ? bannerText : secondary;
  const followInk = followFill === secondary ? pillInk : bannerFill;
  return {
    "--school-primary": primary, "--school-secondary": secondary, "--school-ink": ink,
    "--school-tint": tint, "--school-pill-ink": pillInk, "--school-badge-ink": badgeInk,
    "--school-banner-fill": bannerFill, "--school-banner-text": bannerText, "--school-banner-muted": bannerMuted,
    "--school-banner-stripe": banner && banner !== primary ? primary : secondary,
    "--school-follow-fill": followFill, "--school-follow-ink": followInk,
  } as CSSProperties;
}

export function schoolLogo(slug: string) {
  const { logoSrc } = schoolColors(slug);
  if (logoSrc) return logoSrc;
  return ["svg", "png", "webp"].map(ext => `/images/schools/${slug}.${ext}`)
    .find(path => existsSync(join(process.cwd(), "public", path)));
}
