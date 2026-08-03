import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pptxgenjs references Node built-ins; keep it server-only via the API route.
  serverExternalPackages: ["pptxgenjs"],
};

export default nextConfig;
