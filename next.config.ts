import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Conservative CSP. Inline styles and the PWA theme bootstrap script both
    // require 'unsafe-inline' / 'unsafe-eval'. Tighten if the app stops using
    // either. Service workers require 'self' on both default and connect-src.
    // connect-src is scoped to the Aliyun Bailian inference endpoint + wss:
    // for SSE streaming; widen only if a new upstream is integrated.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://coding-intl.dashscope.aliyuncs.com wss:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24h cache
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Service-worker must always be served from the root so the browser
        // accepts the registration scope of '/'. Disable caching so updates
        // land immediately.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

// `withSentryConfig` is a no-op when `SENTRY_AUTH_TOKEN` is empty — the
// webpack plugin only tries to upload source maps when an auth token is
// present. The SDK itself is tree-shaken from the client bundle when no DSN
// is configured (see the `if (dsn)` guard in sentry.client.config.ts), and
// we additionally strip its debug logging from the build via the
// `webpack.treeshake.removeDebugLogging` option below. All existing headers
// / CSP are preserved because we wrap the already-built `nextConfig` object,
// not the other way around.
export default withSentryConfig(nextConfig, {
  // Optional: only required for source-map upload during `next build`. Leave
  // blank in local dev — the build still succeeds, the plugin just skips
  // upload. The token / org / project are read from the same env vars at
  // runtime if they're not passed here.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Disable route manifest injection in this app — the small bundle savings
  // outweigh the route-grouped transaction names, and the manifest exposes
  // our internal API surface to the client bundle.
  routeManifestInjection: false,
  webpack: {
    // Tree-shake the SDK's debug logger out of the production bundle. Has
    // no effect on Sentry Logs (only on the SDK's own console-based
    // logger). This is the modern replacement for the deprecated top-level
    // `disableLogger` flag.
    treeshake: {
      removeDebugLogging: true,
    },
  },
  sourcemaps: {
    // Once Sentry has uploaded the maps, remove them from `.next/` so the
    // standalone Docker image doesn't ship readable source. Default is true
    // for the SDK, but we restate it to be explicit.
    deleteSourcemapsAfterUpload: true,
  },
});
