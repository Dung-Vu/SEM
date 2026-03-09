import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function ensureShadowScriptTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ShadowScript" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "level" TEXT NOT NULL DEFAULT 'B1',
      "topic" TEXT NOT NULL DEFAULT '',
      "durationSeconds" INTEGER NOT NULL DEFAULT 60,
      "accent" TEXT NOT NULL DEFAULT 'US',
      "tags" TEXT NOT NULL DEFAULT '',
      "source" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ShadowScript_pkey" PRIMARY KEY ("id")
    )
  `);

  const count = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "ShadowScript"`;
  if (Number(count[0].count) === 0) {
    const scripts = [
      ["First Day at Work","Hi everyone, I'm Alex. Today is my first day here.\n\nCan you tell me where the kitchen is? I'd like to know about the lunch break schedule.\n\nI'm going to work hard and learn as much as I can. Please feel free to ask me for help.\n\nThank you for the warm welcome. I look forward to working with all of you.","A2","work",45,"US","a2,work","SEM"],
      ["Ordering at a Café","Good morning! I'd like to order a large latte, please.\n\nCan I also get a blueberry muffin? Is it fresh today?\n\nActually, can I change that to a croissant instead? Sorry for the confusion.\n\nHow much is it? Here's my card. Thank you!","A2","food",40,"US","a2,food","SEM"],
      ["Planning a Weekend Trip","I've been planning a weekend trip to Da Nang!\n\nI'm checking out the Marble Mountains on Saturday morning, then relaxing at My Khe Beach.\n\nOn Sunday, I'll explore Hoi An and try bánh mì, cao lầu, and white rose dumplings.\n\nI've already booked a hotel. It's going to be an amazing trip.","B1","travel",55,"US","b1,travel","SEM"],
      ["Talking About Work Challenges","This week has been really challenging. We have a major project deadline on Friday.\n\nMy manager asked me to prepare a client presentation — something I'd never done.\n\nI spent extra time organizing slides and practicing. My colleague gave great feedback.\n\nThe more I prepared, the more confident I felt. Preparation beats anxiety every time.","B1","work",60,"US","b1,work","SEM"],
      ["Discussing Investment Strategy","When building a portfolio, diversification is the cornerstone of risk management.\n\nSpreading exposure across equities, bonds, real estate, and commodities mitigates market downturn impact.\n\nConsider your risk tolerance. A younger investor can accept short-term volatility for superior long-term returns.\n\nAs you approach your goals, shift towards conservative, income-generating assets to preserve wealth.","B2","finance",65,"US","b2,finance","SEM"],
      ["Technology and the Future of Work","Artificial intelligence is fundamentally reshaping the employment landscape.\n\nWhile automation displaces routine tasks, it generates new roles that didn't exist a decade ago.\n\nThe critical skill gap isn't just technical — it's adaptability, problem-solving, and human empathy.\n\nOrganizations that invest in continuous upskilling will navigate this transition most successfully.","B2","technology",70,"US","b2,tech","SEM"],
      ["Ethical Dilemmas in Business","Ethical decision-making rarely presents a clear binary between right and wrong.\n\nLeaders navigate complex trade-offs between competing legitimate interests — shareholder value vs stakeholder responsibilities.\n\nThe most pragmatic framework integrates consequentialist and deontological thinking, establishing non-negotiable boundaries.\n\nExceptional leaders confront dilemmas with intellectual honesty and transparency.","C1","business",80,"US","c1,ethics","SEM"],
      ["The Neuroscience of Language Learning","Language acquisition leverages the brain's most sophisticated neural machinery.\n\nLearning vocabulary in context encodes not just words, but emotions and situational cues.\n\nThe spaced repetition effect capitalizes on memory consolidation processes during sleep.\n\nEmotional engagement amplifies encoding — why immersive conversation practice accelerates acquisition so dramatically.","C1","academic",75,"US","c1,neuroscience","SEM"],
    ];
    for (const [title, content, level, topic, dur, accent, tags, source] of scripts) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ShadowScript" ("title","content","level","topic","durationSeconds","accent","tags","source")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        title, content, level, topic, Number(dur), accent, tags, source
      );
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");

    await ensureShadowScriptTable();

    const scripts = level
      ? await prisma.$queryRaw<{
          id: string; title: string; content: string; level: string;
          topic: string; durationSeconds: number; accent: string; tags: string;
        }[]>`SELECT * FROM "ShadowScript" WHERE level = ${level} ORDER BY level ASC, title ASC`
      : await prisma.$queryRaw<{
          id: string; title: string; content: string; level: string;
          topic: string; durationSeconds: number; accent: string; tags: string;
        }[]>`SELECT * FROM "ShadowScript" ORDER BY level ASC, title ASC`;

    return NextResponse.json({ scripts });
  } catch (error) {
    console.error("GET /api/shadow/scripts error:", error);
    return NextResponse.json({ error: "Internal server error", scripts: [] }, { status: 500 });
  }
}
