import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 14+ automatically reads the "x-nonce" request header (set by
  // middleware) and stamps it onto every inline <script> it generates,
  // so no extra configuration is needed here for CSP nonce support.
};

export default nextConfig;
