import test from "node:test";
import assert from "node:assert/strict";

import { awardExp } from "@/lib/exp";

test("awardExp increments exp without rewriting level when level does not change", async () => {
  const calls: Array<{ expIncrement?: number; level?: number }> = [];
  const tx = {
    user: {
      update: async ({ data }: { data: { exp?: { increment: number }; level?: number } }) => {
        calls.push({
          expIncrement: data.exp?.increment,
          level: data.level,
        });
        if (data.exp) return { exp: 200, level: 1 };
        return { exp: 200, level: data.level ?? 1 };
      },
    },
  };

  const result = await awardExp(tx as never, "user-1", 10);
  assert.deepEqual(result, { exp: 200, level: 1, leveledUp: false });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].expIncrement, 10);
});

test("awardExp recomputes and persists level when threshold is crossed", async () => {
  const calls: Array<{ expIncrement?: number; level?: number }> = [];
  const tx = {
    user: {
      update: async ({ data }: { data: { exp?: { increment: number }; level?: number } }) => {
        calls.push({
          expIncrement: data.exp?.increment,
          level: data.level,
        });
        if (data.exp) return { exp: 6000, level: 1 };
        return { exp: 6000, level: data.level ?? 1 };
      },
    },
  };

  const result = await awardExp(tx as never, "user-1", 6000);
  assert.equal(result.exp, 6000);
  assert.equal(result.level, 11);
  assert.equal(result.leveledUp, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].level, 11);
});
