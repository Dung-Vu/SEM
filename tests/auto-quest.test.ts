import test from "node:test";
import assert from "node:assert/strict";

import { prisma } from "@/lib/prisma";
import { autoTickQuest } from "@/lib/auto-quest";

test("autoTickQuest returns 0 when the quest was already completed", async () => {
  const prismaAny = prisma as unknown as Record<string, unknown>;
  const originalTemplate = prismaAny.dailyQuestTemplate;
  const originalTransaction = prismaAny.$transaction;

  let activityCalls = 0;
  let userUpdateCalls = 0;

  prismaAny.dailyQuestTemplate = {
    findUnique: async () => ({
      expReward: 20,
      icon: "Q",
      name: "Quest",
    }),
  };
  prismaAny.$transaction = async (callback: (tx: unknown) => Promise<boolean>) =>
    callback({
      questProgress: {
        updateMany: async () => ({ count: 0 }),
        createMany: async () => ({ count: 0 }),
      },
      user: {
        update: async () => {
          userUpdateCalls++;
          return { exp: 100, level: 1 };
        },
      },
      activityLog: {
        create: async () => {
          activityCalls++;
        },
      },
    });

  try {
    const result = await autoTickQuest("user-1", "quest-1");
    assert.equal(result, 0);
    assert.equal(activityCalls, 0);
    assert.equal(userUpdateCalls, 0);
  } finally {
    prismaAny.dailyQuestTemplate = originalTemplate;
    prismaAny.$transaction = originalTransaction;
  }
});

test("autoTickQuest awards EXP exactly once for a fresh completion", async () => {
  const prismaAny = prisma as unknown as Record<string, unknown>;
  const originalTemplate = prismaAny.dailyQuestTemplate;
  const originalTransaction = prismaAny.$transaction;

  let activityCalls = 0;
  let userUpdateCalls = 0;

  prismaAny.dailyQuestTemplate = {
    findUnique: async () => ({
      expReward: 20,
      icon: "Q",
      name: "Quest",
    }),
  };
  prismaAny.$transaction = async (callback: (tx: unknown) => Promise<boolean>) =>
    callback({
      questProgress: {
        updateMany: async () => ({ count: 1 }),
        createMany: async () => ({ count: 0 }),
      },
      user: {
        update: async () => {
          userUpdateCalls++;
          return { exp: 120, level: 1 };
        },
      },
      activityLog: {
        create: async () => {
          activityCalls++;
        },
      },
    });

  try {
    const result = await autoTickQuest("user-1", "quest-1");
    assert.equal(result, 20);
    assert.equal(activityCalls, 1);
    assert.equal(userUpdateCalls, 1);
  } finally {
    prismaAny.dailyQuestTemplate = originalTemplate;
    prismaAny.$transaction = originalTransaction;
  }
});
