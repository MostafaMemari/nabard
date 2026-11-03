import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Photos and receipts are displayed straight from the bucket's public host, so
// that host must be allowed in img-src. The r2.dev wildcard covers the
// development public url (pub-<id>.r2.dev); a connected custom domain
// (R2_PUBLIC_URL) is added by origin so it is allowed too.
const r2CustomOrigin = (() => {
  const base = process.env.R2_PUBLIC_URL?.trim();
  if (!base) return null;

  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
})();

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://*.r2.cloudflarestorage.com",
  "https://*.r2.dev",
  ...(r2CustomOrigin ? [r2CustomOrigin] : []),
].join(" ");

const csp = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
