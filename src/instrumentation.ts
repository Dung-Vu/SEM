// Next.js Instrumentation Hook — runs server-side on startup
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
// Phase 18: Initialize notification cron jobs here

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initNotificationCron } = await import(
      "@/lib/notifications/cron"
    );
    initNotificationCron();
  }
}
