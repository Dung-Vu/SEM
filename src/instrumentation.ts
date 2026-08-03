// Next.js Instrumentation Hook — runs server-side on startup
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
//
// Sprint 2: notification scheduling moved out-of-process. The previous in-app
// `node-cron` registration has been replaced by per-kind handlers under
// src/app/api/cron/* that are invoked by Vercel Cron (see vercel.json) — or,
// in self-hosted deployments, by an external scheduler.
//
// Set CRON_DISABLED=1 (which is the default in production) to skip the legacy
// hook entirely so an old container cannot silently fire duplicate jobs.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.CRON_DISABLED === "1") {
    console.info(
      "[instrumentation] CRON_DISABLED=1 — in-process cron is disabled. Use /api/cron/* + vercel.json."
    );
    return;
  }

  // Soft deprecation: log a warning if a developer locally still runs the old
  // node-cron path. Production must keep CRON_DISABLED=1 to prevent duplicate
  // notifications when both Vercel Cron and the in-process timer fire.
  try {
    const { initNotificationCron } = await import("@/lib/notifications/cron");
    console.warn(
      "[instrumentation] ⚠️ initNotificationCron() is deprecated. Schedule /api/cron/* via Vercel Cron instead."
    );
    initNotificationCron();
  } catch (err) {
    console.warn("[instrumentation] failed to load legacy cron helper:", err);
  }
}
