import type { NextConfig } from "next";
import { BASE_PATH } from "./util/constants";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  experimental: {
    turbopackScopeHoisting: false,
  },
  /* config options here */
};

export default nextConfig;
