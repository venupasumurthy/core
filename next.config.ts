import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress hydration warnings from inline scripts
  reactStrictMode: false,
};

export default nextConfig;
