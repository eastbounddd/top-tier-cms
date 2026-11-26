import type { CSSProperties } from "react";

export const SCHOOL_COLORS: Record<string, [string, string, string?]> = {
  alabama: ["#9E1B32", "#FFFFFF"], arkansas: ["#9D2235", "#FFFFFF"], auburn: ["#0C2340", "#E87722"],
  baylor: ["#154734", "#FFB81C"], byu: ["#002E5D", "#FFFFFF"], clemson: ["#F66733", "#522D80", "#522D80"],
  fsu: ["#782F40", "#CEB888"], georgia: ["#BA0C2F", "#000000"], illinois: ["#E84A27", "#13294B", "#13294B"],
  kansas: ["#0051BA", "#E8000D"], kentucky: ["#0033A0", "#FFFFFF"], marshall: ["#00B140", "#FFFFFF", "#005F28"],
  michigan: ["#00274C", "#FFCB05"], "mississippi-state": ["#5D1727", "#FFFFFF"], missouri: ["#000000", "#F1B82D"],
  nebraska: ["#E41C38", "#F5F1E7", "#B30E2A"], "notre-dame": ["#0C2340", "#C99700"], oklahoma: ["#841617", "#FFF4D8"],
  "oregon-state": ["#DC4405", "#000000", "#000000"], tennessee: ["#FF8200", "#FFFFFF", "#8A4100"], tulane: ["#006747", "#43B3AE"],
  utah: ["#CC0000", "#000000"], vanderbilt: ["#1C1C1C", "#CFAE70"], "virginia-tech": ["#630031", "#CF4420"],
  lsu: ["#461D7C", "#FDD023"], texas: ["#BF5700", "#FFFFFF", "#9D4500"],
};

export function schoolTheme(slug?: string): CSSProperties {
  const [primary, secondary, dark] = SCHOOL_COLORS[slug ?? ""] ?? ["#C81E25", "#FFFFFF"];
  return { "--school-primary": primary, "--school-secondary": secondary, "--school-ink": dark ?? primary } as CSSProperties;
}
