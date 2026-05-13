# Development Guide

## Working Rules

- Keep `npm run lint`, `npm run test`, `npx tsc --noEmit`, `npx prisma validate`, and `npm run build` green.
- Use `src/lib/current-user.ts` for the current single-user lookup until real auth is introduced.
- Keep business rules in `src/lib`; API routes should validate input, call domain logic, and return JSON.
- Do not add new root-level planning docs. Put current docs under `docs/`; rely on git history for old phase plans.
- Do not commit local databases, build output, generated caches, or scratch scripts.

## App Architecture

- `src/app/layout.tsx` owns global providers, PWA metadata, service worker registration, theme bootstrapping, and the app shell.
- `src/components/AppShell.tsx` owns the mobile app frame, bottom navigation, More drawer, and `QuickAddWord`.
- Dashboard data is split across `/api/dashboard/hero`, `/api/dashboard/streak`, and `/api/dashboard/stats`.
- Most mutations award EXP and often log analytics events through `src/lib/analytics.ts`.
- SENSEI tutor memory is stored through `TutorMemory` and used by `src/lib/sensei-prompt.ts`.

## Data And Seeds

- Prisma schema source of truth: `prisma/schema.prisma`.
- Prisma CLI config: `prisma.config.ts`.
- Core seed: `npm run db:seed`.
- Full content seed: `npm run db:seed-all`.
- Production and Docker paths use PostgreSQL through `DATABASE_URL`.
- Runtime schema changes belong in Prisma schema/seed scripts, not API routes.

## AI Integration

The app expects an OpenAI-compatible chat completions endpoint:

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

AI features include Speak streaming, writing grading, prompt generation, weekly reports, insights, and exam generation.

## PWA And Notifications

- Service worker: `public/sw.js`.
- Manifest: `public/manifest.json`.
- Push subscription APIs: `/api/push/subscribe` and `/api/push/send`.
- Notification settings API: `/api/notifications/settings`.
- Runtime cron: `src/lib/notifications/cron.ts`.
- Hosted cron endpoint: `/api/analytics/cron`.
- Internal mutation/debug routes must fail closed and require `INTERNAL_API_SECRET` or `CRON_SECRET`.

## Cleanup Standard

Before considering the repo clean:

1. No unused files that are not referenced by source, scripts, docs, or deployment.
2. Root contains only project entrypoints and config.
3. Historical planning docs should not be reintroduced; use `docs/archive/README.md` plus git history when old context is needed.
4. README describes the current app, not the create-next-app template.
5. Verification commands pass.
