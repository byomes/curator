import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/base-path";

const nextConfig: NextConfig = {
  // Served behind a reverse-proxy rewrite at wtsn.me/curator/* (see
  // watson-tools' next.config.ts). basePath makes every Link, redirect,
  // Server Action, and static asset URL Next.js generates carry the
  // /curator prefix automatically.
  basePath: BASE_PATH,
};

export default nextConfig;
