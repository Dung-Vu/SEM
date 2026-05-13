# SEM — Self English Mastery

SEM is a personal English-learning PWA built as a mobile-first daily driver. It combines gamified progress, Anki-style SRS, AI speaking practice, writing review, exam mode, analytics, and smart notifications.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Prisma 6 with PostgreSQL
- Tailwind CSS 4 plus app-level design tokens in `src/app/globals.css`
- Recharts, Framer Motion, Lucide icons
- Web Push, service worker offline cache, scheduled notification jobs
- OpenAI-compatible chat completions through `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`

## Project Map

- `src/app` — pages and API routes
- `src/components` — shared UI, dashboard, analytics, onboarding, notifications
- `src/lib` — business logic for SRS, EXP, analytics, AI, writing, exams, notifications
- `prisma` — schema and seed scripts
- `public` — PWA manifest, service worker, icons, offline page
- `docs` — current development docs and archived phase notes

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill local values.

Required variables:

```env
DATABASE_URL=
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
NEXT_PUBLIC_APP_URL=
INTERNAL_API_SECRET=
CRON_SECRET=
```

3. Sync Prisma and seed baseline data:

```bash
npm run db:push
npm run db:seed
```

4. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verification

Run this before committing meaningful changes:

```bash
npm run lint
npm run test
npx tsc --noEmit
npx prisma validate
npm run build
```

Current clean baseline is documented in `docs/STATUS.md`.

## Useful Commands

```bash
npm run dev          # local dev server
npm run dev:lan      # LAN-accessible dev server
npm run build        # production build
npm run start        # run built app
npm run lint         # ESLint
npm run db:push      # push Prisma schema to database
npm run db:seed      # seed core data through prisma/seed.ts
npm run db:seed-all  # run content seed scripts
npm run db:studio    # Prisma Studio
```

## Deployment Notes

- `next.config.ts` uses `output: "standalone"` for container deployment.
- Docker maps the app to host port `3001` and expects PostgreSQL on `host.docker.internal:5432`.
- Vercel cron calls `/api/analytics/cron`.
- Runtime notification cron jobs are initialized from `src/instrumentation.ts`.
- Internal-only routes such as `/api/push/send`, `/api/seed-phase12`, and `/api/exp` require `x-internal-secret` matching `INTERNAL_API_SECRET` or `CRON_SECRET`.

## Documentation

- `docs/DEVELOPMENT.md` — development conventions and cleanup rules
- `docs/STATUS.md` — current repo status and verification baseline
- `docs/archive` — archive index for removed historical phase notes
