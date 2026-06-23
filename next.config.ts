import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "picsum.photos",
      "jblcqcxckefmydvtrxbi.supabase.co",
    ],
  },
};

export default nextConfig;
