import type { Metadata } from "next";
export const canonicalSite = "https://www.toptierstate.net";
export function pageMetadata(title: string, description: string, path: string): Metadata {
 const url = `${canonicalSite}${path === "/" ? "" : path}`;
 const fullTitle = `${title} | Top Tier`;
 return { title, description, alternates: { canonical: url }, openGraph: { type:"website", siteName:"Top Tier", title:fullTitle, description, url, images:[{url:`${canonicalSite}/social-default.png`,width:1200,height:630,alt:"Top Tier"}] }, twitter: { card:"summary_large_image", site:"@TopTierStateX", title:fullTitle, description, images:[`${canonicalSite}/social-default.png`] } };
}
