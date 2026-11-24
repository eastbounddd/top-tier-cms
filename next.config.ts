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
    return [{ source: "/:asset(.*\\.(?:png|webp|ico))", headers: [{key:"Cache-Control",value:"public, max-age=86400, stale-while-revalidate=604800"}] }];
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
