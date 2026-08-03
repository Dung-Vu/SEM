// Phase 12 schema inspection.
//
// Historical risk: this route sat on the public API surface and was reachable
// whenever NODE_ENV !== "production" (including staging). It also exposed
// schema / column metadata through information_schema queries.
//
// Fix: keep the route as a strict dev-only diagnostic, gated by NODE_ENV
// AND the internal secret. The proper seeding script is `prisma/seed-phase12-pg.js`
// (run via `npm run db:seed-phase12`) — do not use this endpoint for seeding.
//
// Run schema inspection one of two ways:
//   1) CLI:   npm run db:phase12:status
//   2) HTTP:  GET /api/seed-phase12  with headers:
//               x-internal-secret: <INTERNAL_API_SECRET>

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertInternalRequest } from "@/lib/server-security";

export async function GET(request: Request) {
  // Hard gate 1: never serve in production, regardless of any other setting.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Hard gate 2: require the internal secret. assertInternalRequest returns
  // 503 if no secret is configured, 401 on a mismatch — either way the route
  // is closed unless the operator explicitly opted in.
  const unauthorized = assertInternalRequest(request);
  if (unauthorized) return unauthorized;

  const log: string[] = [];

  try {
    const userCount = await prisma.user.count();
    log.push(`✅ user.count: ${userCount}`);
  } catch (e) {
    log.push(`❌ user.count: ${String(e).slice(0, 200)}`);
    return NextResponse.json({ log, error: "DB connection failed" }, { status: 500 });
  }

  try {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('Milestone','ShadowScript','ConversationPrompt','WeeklyBossCompletion','UserMilestone','PushSubscription')
      ORDER BY tablename
    `;
    log.push(`📋 Phase12 tables: ${tables.map(t => t.tablename).join(", ") || "NONE FOUND"}`);

    if (tables.some(t => t.tablename === "Milestone")) {
      const mCount = await prisma.$queryRaw<{ count: string }[]>`SELECT COUNT(*)::text as count FROM "Milestone"`;
      log.push(`📊 Milestone rows: ${mCount[0]?.count ?? "0"}`);
      const cols = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name = 'Milestone' AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      log.push(`🔍 Milestone columns: ${cols.map(c => c.column_name).join(", ")}`);
    }
    if (tables.some(t => t.tablename === "ShadowScript")) {
      const sCount = await prisma.$queryRaw<{ count: string }[]>`SELECT COUNT(*)::text as count FROM "ShadowScript"`;
      log.push(`📊 ShadowScript rows: ${sCount[0]?.count ?? "0"}`);
    }
  } catch (e) {
    log.push(`❌ table check: ${String(e).slice(0, 200)}`);
  }

  log.push("⚠️ Use `npm run db:seed-phase12` for the actual seed; this route is diagnostic only.");

  return NextResponse.json({ success: true, log });
}
