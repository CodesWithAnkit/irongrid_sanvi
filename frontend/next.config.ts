import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Silence monorepo lockfile root inference warnings
  outputFileTracingRoot: path.join(__dirname, ".."),
  /* config options here */
};

export default nextConfig;
