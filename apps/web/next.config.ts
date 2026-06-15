import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/projects/strategy-visualiser/app',
  experimental: {
    turbopackScopeHoisting: false,
  },
  /* config options here */
};

export default nextConfig;
