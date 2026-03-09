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

echo "✅ Database ready!"
echo "🎮 Starting English Quest on port 3000..."

# Start Next.js
exec node server.js
