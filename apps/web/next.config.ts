import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  experimental: {
    turbopackScopeHoisting: false,
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        // Health check
        {
          source: "/api/health",
          destination: `${BACKEND_URL}/api/health`,
        },
        // Jobs API
        {
          source: "/api/jobs/:path*",
          destination: `${BACKEND_URL}/api/jobs/:path*`,
        },
        // Stocks API
        {
          source: "/api/stocks/:path*",
          destination: `${BACKEND_URL}/api/stocks/:path*`,
        },
        // Strategies API
        {
          source: "/api/strategies/:path*",
          destination: `${BACKEND_URL}/api/strategies/:path*`,
        },
        // Yahoo API
        {
          source: "/api/yahoo/:path*",
          destination: `${BACKEND_URL}/api/yahoo/:path*`,
        },
        // Swagger UI
        {
          source: "/swagger-ui/:path*",
          destination: `${BACKEND_URL}/swagger-ui/:path*`,
        },
        {
          source: "/swagger-ui.html",
          destination: `${BACKEND_URL}/swagger-ui.html`,
        },
        // OpenAPI Spec
        {
          source: "/v3/api-docs/:path*",
          destination: `${BACKEND_URL}/v3/api-docs/:path*`,
        },
        {
          source: "/openapi/:path*",
          destination: `${BACKEND_URL}/openapi/:path*`,
        },
      ],
    };
  },
  /* config options here */
};

export default nextConfig;
