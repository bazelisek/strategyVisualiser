import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackScopeHoisting: false,
  },
  /* config options here */
};

export default nextConfig;
