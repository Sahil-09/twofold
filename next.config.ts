import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "web-push", "playwright-core", "@sparticuz/chromium"],
};


export default nextConfig;
