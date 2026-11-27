import { Barlow_Condensed, Inter } from "next/font/google";
import { schemaJson } from "@/lib/structuredData";
import { topTierLogo } from "@/lib/brand";
import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./social-polish.css";
import "./editorial.css";
import "./newsroom.css";

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.toptierstate.net"),
  title: { default: "Top Tier | College Football News", template: "%s | Top Tier" },
  description: "Independent college football news, analysis and original reporting.",
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${inter.variable}`} style={{ WebkitTextSizeAdjust: "100%" }}>
      <head>
        <Script
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4496694336127208"
          crossOrigin="anonymous"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EC1F990094"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-EC1F990094');`}
        </Script>
      </head>
      <body><a className="skip-link" href="#main-content">Skip to main content</a>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:schemaJson({"@context":"https://schema.org","@graph":[{"@type":["NewsMediaOrganization","Organization"],"@id":"https://www.toptierstate.net/#organization",name:"Top Tier Media",alternateName:"Top Tier",url:"https://www.toptierstate.net",logo:{"@type":"ImageObject",url:`https://www.toptierstate.net${topTierLogo.src}`,width:topTierLogo.width,height:topTierLogo.height},sameAs:["https://x.com/TopTierStateX","https://www.instagram.com/TopTierState","https://www.tiktok.com/@TopTierState"]},{"@type":"WebSite",name:"Top Tier",url:"https://www.toptierstate.net",publisher:{"@id":"https://www.toptierstate.net/#organization"}}]})}}/><Analytics /></body>
    </html>
  );
}
