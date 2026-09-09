import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle Admin in server output to avoid Turbopack external-package aliases.
  // server-only imports keep this dependency out of client bundles.
  transpilePackages: ["firebase-admin"],
};

export default nextConfig;
