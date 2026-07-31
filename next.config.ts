import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
};

// PWA injeta config webpack; em dev o Next 16 usa Turbopack por padrão.
export default process.env.NODE_ENV === "development"
  ? nextConfig
  : withPWA(nextConfig);
