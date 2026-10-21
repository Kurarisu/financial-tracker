import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
