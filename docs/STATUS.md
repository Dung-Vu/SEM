# Repo Status

Last verified: 2026-05-13, Asia/Saigon.

## Current Baseline

- Branch: `main`
- Runtime: Next.js 16.1.6, React 19.2.3, Prisma 6.19.2
- Database target: PostgreSQL through `DATABASE_URL`
- App mode: mobile-first PWA
- Current auth model: single-user lookup centralized through `getCurrentUser()`
- Internal-only routes require `INTERNAL_API_SECRET` or `CRON_SECRET`

## Verification

The current cleanup baseline passes:

```bash
npm run lint
npm run test
npx tsc --noEmit
npx prisma validate
npm run build
```

## Cleanup Completed

- Replaced generic create-next README with current project docs.
- Removed stale phase planning documents; `docs/archive/README.md` now points to current docs and git history.
- Removed unused create-next SVG assets.
- Removed unused UI skeleton/error components, unused shared types, and unused EXP float hook.
- Removed ignored scratch artifacts from the workspace.
- Switched font loading to `next/font`.
- Added `prisma.config.ts` and removed deprecated `package.json#prisma` config.
- Removed stale SQLite override from `prisma/seed.ts`.
- Expanded `db:seed-all` to cover current content seed scripts.
- Added focused tests for timezone helpers, EXP awarding, and auto-quest idempotency.
- Centralized API current-user lookup through `src/lib/current-user.ts`.
- Locked internal/debug routes behind internal secrets and removed runtime raw-DDL table creation.
- Standardized local-day and local-week logic across analytics, activity logs, SRS due dates, reports, and client heatmaps.
- Standardized local-month and local ISO week-year logic for monthly reviews, streak freezes, weekly stats, quests, and boss history.
- Hardened exam submission against repeated or overlapping submit requests.
- Hardened AI chat prompt handling plus API input validation for exams, weekly stats, resources, reading logs, notification settings, and writing submission limits.
- Replaced the Settings page's browser-only AI model picker with runtime AI status from the server environment.

## Known Intentional Choices

- The app still uses many feature-specific page-local types. Do not introduce shared types unless reuse is real.
- Docker startup still runs idempotent JavaScript seed scripts for deployment convenience.
