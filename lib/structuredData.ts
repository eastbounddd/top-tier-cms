import { canonicalSite } from "@/lib/pageMetadata";
export function breadcrumbSchema(items: { name: string; path: string }[]) { return { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement: [{name:"Home",path:"/"}, ...items].map((item,index)=>({"@type":"ListItem",position:index+1,name:item.name,item:`${canonicalSite}${item.path === "/" ? "" : item.path}`})) }; }
export function schemaJson(value: unknown) { return JSON.stringify(value).replace(/</g,"\\u003c"); }
