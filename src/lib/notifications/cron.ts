// Sprint 2: scheduling moved to Vercel Cron + /api/cron/* handlers.
// This module is preserved as a deprecated no-op shim so that
// `src/instrumentation.ts` still has something to dynamically import during the
// transition. Do NOT add new `cron.schedule(...)` calls here — every schedule
// must live in a route under src/app/api/cron/*.

/**
 * @deprecated Use Vercel Cron + the per-kind handlers under `src/app/api/cron/*`.
 */
export function initNotificationCron(): void {
  console.warn(
    "[HERALD] initNotificationCron() is a no-op. Cron jobs now run via /api/cron/* + vercel.json."
  );
}
