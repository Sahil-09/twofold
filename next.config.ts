import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "web-push"],
};

export default nextConfig;
