import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the turbopack root to the current project to avoid
    // workspace/root detection issues when multiple lockfiles exist.
    root: "./"
  },
  /* config options here */
};

export default nextConfig;
