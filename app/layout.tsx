import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./social-polish.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://toptierstate.net"
  ),
  title: { default: "Top Tier | College Football News", template: "%s | Top Tier" },
  description: "Independent college football news, analysis and original reporting.",
  icons: { icon: "/top-tier-logo.png", apple: "/top-tier-logo.png" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EC1F990094"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-EC1F990094');`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
