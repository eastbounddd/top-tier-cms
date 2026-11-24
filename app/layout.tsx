import localFont from "next/font/local";
import { schemaJson } from "@/lib/structuredData";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./social-polish.css";

const barlow = localFont({src:[{path:"./fonts/barlow-500.woff2",weight:"500"},{path:"./fonts/barlow-600.woff2",weight:"600"},{path:"./fonts/barlow-700.woff2",weight:"700"},{path:"./fonts/barlow-800.woff2",weight:"800"},{path:"./fonts/barlow-900.woff2",weight:"900"}],variable:"--font-barlow",display:"swap"});
const inter = localFont({src:[{path:"./fonts/inter-400.woff2",weight:"400"},{path:"./fonts/inter-500.woff2",weight:"500"},{path:"./fonts/inter-600.woff2",weight:"600"},{path:"./fonts/inter-700.woff2",weight:"700"}],variable:"--font-inter",display:"swap"});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.toptierstate.net"
  ),
  title: { default: "Top Tier | College Football News", template: "%s | Top Tier" },
  description: "Independent college football news, analysis and original reporting.",
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${inter.variable}`}>
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
      <body><a className="skip-link" href="#main-content">Skip to main content</a>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:schemaJson({"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://www.toptierstate.net/#organization",name:"Top Tier",url:"https://www.toptierstate.net",logo:{"@type":"ImageObject",url:"https://www.toptierstate.net/top-tier-logo-optimized.webp",width:384,height:384},sameAs:["https://x.com/TopTierStateX"]},{"@type":"WebSite",name:"Top Tier",url:"https://www.toptierstate.net",publisher:{"@id":"https://www.toptierstate.net/#organization"}}]})}}/></body>
    </html>
  );
}
