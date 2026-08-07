import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "unavatar.io" }
    ]
  }
};

export default nextConfig;
