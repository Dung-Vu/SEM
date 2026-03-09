import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const log: string[] = [];

  // Step 1: Test basic connection
  try {
    const userCount = await prisma.user.count();
    log.push(`✅ user.count: ${userCount}`);
  } catch (e) {
    log.push(`❌ user.count: ${String(e).slice(0, 200)}`);
    return NextResponse.json({ log, error: "DB connection failed" }, { status: 500 });
  }

  // Step 2: Check which Phase 12 tables exist and their row counts
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
      log.push(`📊 Milestone rows: ${mCount[0].count}`);
      const cols = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name = 'Milestone' AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      log.push(`🔍 Milestone columns: ${cols.map(c => c.column_name).join(", ")}`);
    }
    if (tables.some(t => t.tablename === "ShadowScript")) {
      const sCount = await prisma.$queryRaw<{ count: string }[]>`SELECT COUNT(*)::text as count FROM "ShadowScript"`;
      log.push(`📊 ShadowScript rows: ${sCount[0].count}`);
    }
  } catch (e) {
    log.push(`❌ table check: ${String(e).slice(0, 200)}`);
  }

  return NextResponse.json({ success: true, log });
}
