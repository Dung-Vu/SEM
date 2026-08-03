// Browser-side Sentry initialization. Next.js auto-loads this file via the
// `@sentry/nextjs` SDK. If `NEXT_PUBLIC_SENTRY_DSN` is empty the SDK is fully
// disabled and the client bundle ships no Sentry code at all (the `if` guard
// is evaluated at build time and tree-shaken by webpack).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Replays are intentionally NOT enabled — adds bundle weight we don't need
    // for the current observability goals. Flip this on if/when we want them.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Don't ship dev noise to Sentry.
    enabled: process.env.NODE_ENV === "production",
  });
}
