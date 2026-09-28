import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle Admin in server output to avoid Turbopack external-package aliases.
  // server-only imports keep this dependency out of client bundles.
  transpilePackages: ["firebase-admin"],
  // Nodemailer resolves its transports and encodings with dynamic requires,
  // which the bundler cannot follow. Leaving it external keeps it loading from
  // node_modules at runtime instead of shipping a half-traced copy.
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
