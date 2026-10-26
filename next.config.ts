import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    resolveAlias: {
      playwright: './lib/playwright-shim.ts',
    },
  },
  webpack: (config) => {
    config.resolve.alias['playwright'] = path.resolve(process.cwd(), 'lib/playwright-shim.ts');
    return config;
  },
};

export default nextConfig;
