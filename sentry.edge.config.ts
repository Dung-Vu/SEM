// Edge runtime Sentry initialization. Next.js auto-loads this file via the
// `@sentry/nextjs` SDK. Edge runs middleware and a handful of low-cost routes
// in Vercel; if `SENTRY_DSN` is empty the SDK is fully disabled.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}
