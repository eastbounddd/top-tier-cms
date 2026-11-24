import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/articles/articles-alex-collins-arkansas-razorbacks",
        destination: "/articles/alex-collins-arkansas-razorbacks",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy-Report-Only", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.google.com https://*.doubleclick.net https://platform.twitter.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' https://www.youtube.com https://*.google.com https://*.doubleclick.net https://platform.twitter.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" }
    ] }, { source: "/:asset(.*\\.(?:png|webp|ico))", headers: [{key:"Cache-Control",value:"public, max-age=86400, stale-while-revalidate=604800"}] }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "unavatar.io" }
    ]
  }
};

export default nextConfig;
