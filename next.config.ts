import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  // Allow LAN devices (e.g. testing on a phone) and the ngrok tunnel to load
  // Next.js dev resources/HMR.
  allowedDevOrigins: ["192.168.2.26", "lately-sought-cougar.ngrok-free.app", "preview-flint-flammable.ngrok-free.dev"]
};

export default nextConfig;
