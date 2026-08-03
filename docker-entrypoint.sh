#!/bin/sh
set -e

echo "🚀 English Quest — Starting..."

# Run Prisma migrations
echo "📦 Pushing database schema..."
npx prisma db push --skip-generate 2>/dev/null || true

# Seed data if tables are empty
echo "🌱 Checking seed data..."
node prisma/seed.js 2>/dev/null || true
node prisma/seed-words.js 2>/dev/null || true
node prisma/seed-words-a1-expanded.js 2>/dev/null || true
node prisma/seed-words-a2.js 2>/dev/null || true
node prisma/seed-words-specialty.js 2>/dev/null || true
node prisma/seed-quests.js 2>/dev/null || true
node prisma/seed-quests-expanded.js 2>/dev/null || true
node prisma/seed-resources.js 2>/dev/null || true
node prisma/seed-writing-quests.js 2>/dev/null || true
node prisma/seed-writing-prompts.js 2>/dev/null || true
node prisma/seed-exam-questions.js 2>/dev/null || true

# Sprint 2: cron scheduling is handled out-of-process. In production we force
# the in-process node-cron hook to stay disabled so that notifications cannot
# be double-sent if both Vercel Cron and the legacy timer fire.
export CRON_DISABLED="${CRON_DISABLED:-1}"
if [ "$CRON_DISABLED" = "1" ]; then
  echo "⏰ CRON_DISABLED=1 — in-process cron is off. Use Vercel Cron /api/cron/* instead."
else
  echo "⚠️  CRON_DISABLED != 1 — deprecated in-process cron will still run (dev only)."
fi

echo "✅ Database ready!"
echo "🎮 Starting English Quest on port 3000..."

# Start Next.js
exec node server.js
