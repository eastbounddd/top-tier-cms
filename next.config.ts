import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  expireTime: 360,
  outputFileTracingIncludes: { "/*": ["./public/images/schools/**/*", "./public/images/school-x/**/*"] },
  async redirects() {
    return [
      { source: "/college-basketball", destination: "/basketball", permanent: true },
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
    qualities: [75, 85],
    deviceSizes: [390, 640, 768, 960, 1200, 1600, 1920],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "unavatar.io" }
    ]
  }
};

export default nextConfig;
