import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "150mb",
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Remotion bundler/renderer from webpack processing
      // Use a function-based external to properly handle these packages
      const originalExternals = config.externals || [];
      config.externals = [
        ...Array.isArray(originalExternals) ? originalExternals : [originalExternals],
        (context: any, request: string, callback: any) => {
          if (
            request.startsWith("@remotion/bundler") ||
            request.startsWith("@remotion/renderer") ||
            request.startsWith("@remotion/lambda") ||
            request.startsWith("esbuild")
          ) {
            return callback(null, "commonjs " + request);
          }
          callback();
        },
      ];
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};

export default nextConfig;
