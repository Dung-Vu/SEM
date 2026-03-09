-- Phase 12 tables: Milestone, UserMilestone, ShadowScript, ConversationPrompt, WeeklyBossCompletion, PushSubscription

-- Milestone table
CREATE TABLE IF NOT EXISTS "Milestone" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "key" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetValue" INTEGER NOT NULL,
  "rewardDesc" TEXT NOT NULL DEFAULT '',
  "expReward" INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- UserMilestone table
CREATE TABLE IF NOT EXISTS "UserMilestone" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserMilestone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserMilestone_userId_milestoneId_key" UNIQUE ("userId", "milestoneId"),
  CONSTRAINT "UserMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "UserMilestone_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ShadowScript table
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
);

-- ConversationPrompt table
CREATE TABLE IF NOT EXISTS "ConversationPrompt" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "modeKey" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'B1',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "tips" TEXT NOT NULL DEFAULT '',
  "keywords" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationPrompt_pkey" PRIMARY KEY ("id")
);

-- WeeklyBossCompletion table
CREATE TABLE IF NOT EXISTS "WeeklyBossCompletion" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "weekKey" TEXT NOT NULL,
  "bossName" TEXT NOT NULL DEFAULT '',
  "score" INTEGER NOT NULL DEFAULT 0,
  "expReward" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyBossCompletion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeeklyBossCompletion_userId_weekKey_key" UNIQUE ("userId", "weekKey"),
  CONSTRAINT "WeeklyBossCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- PushSubscription table
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL UNIQUE,
  "auth" TEXT NOT NULL DEFAULT '',
  "p256dh" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
