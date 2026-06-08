import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/status",
        destination: "/api/v1/status",
      },
    ];
  },
};

export default nextConfig;
