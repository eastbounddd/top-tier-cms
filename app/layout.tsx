import type { Metadata } from "next";
import "./globals.css";
import "./social-polish.css";

export const metadata: Metadata = {
  title: { default: "Top Tier | College Football News", template: "%s | Top Tier" },
  description: "Independent college football news, analysis and original reporting.",
  icons: { icon: "/top-tier-logo.png", apple: "/top-tier-logo.png" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
